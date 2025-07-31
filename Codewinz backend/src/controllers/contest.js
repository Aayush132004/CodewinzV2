const Contest=require("../models/contestModel");
const Problem=require("../models/problem");
const User=require("../models/user");
const ContestSubmission=require("../models/contestSubmission");
const ContestParticipantScore=require("../models/contestParticipantScore")
const {getLanguageById,submitBatch,submitToken}=require("../utils/problemUtility");
const createContest=async(req,res)=>{
try{ 
    // console.log(req.body);
    // console.log("hello");
// if(!req.body)
//     throw new Error("Input data missing");

const {title,startDate,endDate,problems}=req.body;

const createdContest=await Contest.create({
...req.body,
registeredUsers:[],
creator:req.result._id,
})
// console.log(createdContest);
res.status(200).json({
    "message":"Contest Created Successfully"
});
}
catch(e){
console.log(e);
res.status(500).json({
    "message":e.message,
})
}
}
 const getAllContest=async(req,res)=>{
  try{
    //  console.log("hi");
    //giving only upcoming and ones in which user registered 
    const allContest = await Contest.find({
        //$or: is a logical or operator ye ya ye koi condn true ho 
  $or: [
    { startDate: { $gt: Date.now() } },
    { registeredUsers: req.result._id},
  ],
}).sort({ startDate: 1 });
    // console.log(allContest);
     if (allContest.length===0)
        throw new Error("No contests exist");
    res.status(200).json({
        "contests":allContest,
    })
  }
  catch(e){
    // console.log(e)
    res.status(500).json({
        "message":"Internal server error"
    })
  }
 }
    

const registerContest=async(req,res)=>{
    try{
        console.log("hi")
      //when person register simply us contest ke registered array mai push krwadunga  user ke id  bs contest ke id lene pdegi wo params se lelunga 
    const {id}=req.params;
    console.log(id);
    const contest=await Contest.findById(id);
    if(contest.startDate<=Date.now())
      throw new Error("Contest started cant register now")
    contest.registeredUsers.push(req.result._id);
    await contest.save();
    console.log("registered");
    res.status(200).send("Successfully registered for contest")
    }
    catch(e){ 
        console.log(e)
     res.status(500).json({
        "message":"Internal Server Error"
     })
    }
}
const getContestById=async(req,res)=>{
    try{
    const {id}=req.params;
    const contest=await Contest.findById(id);
    console.log(contest);
    if(!contest)
        throw new Error("No contest found");
    res.status(200).send(contest);

    }
    catch(e){
        res.status(500).json({
            "message":e.message,
        })
    }

}
const submit=async(req,res)=>{
      try{
        // console.log("hitted")
    

    const {problemId}=req.params;
    const {code,contestId,language,points}=req.body;
    const userId=req.result._id;
    const contest=await Contest.findById(contestId);
    if(contest.endDate<Date.now())
        throw new Error("Contest Ended Cant Submit Now");
    // console.log({
    //     "code":code,
    //     "contestId":contestId,
    //     "points":points,
    //     "problemId":problemId,
    //     "language":language,
    //     "userId":userId,
    // });
        //problemId sending via param
        //code and language we take from frontend
        //from frontend sending cpp as monaco does so chaning here
        if(language==='cpp')
            language='c++'
    
        if(!userId||!problemId||!code||!language||!contestId)
            return res.status(400).send("Some field missing");
    
        //fetch problem from database then run in judge0 to get rest data for our submission ie testcases and all
        const problem=await Problem.findById(problemId);

        // const getScore=(problem)=>{
        // if(problem.difficulty==="hard")
        //     return 100;
        //  if(problem.difficulty==="easy")
        //     return 20;
        //  if(problem.difficulty==="medium")
        //     return 50;
        // }
        
        const problemMaxScore=points;
        //testcases(hidden)we got 
    
        //have now two choices
        //1) send code to judge0 and result when came store in database
        //2) store in database with status code of pending and when result come from judge0 update it in database
    
        //second one better as if server of judge0 got error and gave no result and in submissions also it wont show even submitted by frontend hence user experience will reduce hence use second approach ie maintain the state before hand only of the submission with pending status and when judge0 or some external API give result update it hence no data loss history maintain
    
        const submittedResult=await ContestSubmission.create({
          userId,
          problemId,
          contestId,
          score:0,
          code,
          language,
          status:"pending",
          totalTestCases:problem.hiddenTestCases.length
        });
    
        //submit code to judge0
        const languageId=getLanguageById(language);
        const submission=problem.hiddenTestCases.map((testcase)=>({
        source_code:code,
        language_id:languageId,
        stdin:testcase.input,
        expected_output:testcase.output
    }))
    // console.log(submission)
    //submitting it 
    const submitResult=await submitBatch(submission);
    // console.log(submitResult)
    //fetching tokens in an array
    const result=submitResult.map((value)=>value.token);
    //submitting token 
    const testResult=await submitToken(result);
    //update SubmittedResult of database
    //for it see what things come as output in testResult can do console log in createProblem one or even here 
    
    let memory=0;
    let status='accepted';
    let errorMessage=null;
    let runtime=0;
    let testCasesPassed=0;
    let currentSubmissionScore=0;
    
    function getErrorByID(id) {
  const statuses = {
    1: "In Queue",
    2: "Processing",
    4: "Wrong Answer",
    5: "Time Limit Exceeded",
    6: "Compilation Error",
    7: "Runtime Error (SIGSEGV)",
    8: "Runtime Error (SIGXFSZ)",
    9: "Runtime Error (SIGFPE)",
    10: "Runtime Error (SIGABRT)",
    11: "Runtime Error (NZEC)",
    12: "Runtime Error (Other)",
    13: "Internal Error",
    14: "Exec Format Error"
  };

  return statuses[id] || "Unknown Error";
}
    for(const test of testResult){
        if(test.status_id==3){
            testCasesPassed++;
            runtime=runtime+parseFloat(test.time);
            memory=Math.max(memory,test.memory);
            currentSubmissionScore = problemMaxScore;
        }
        else{
               
                status=getErrorByID(test.status_id);
                errorMessage=test.stderr;
                currentSubmissionScore = 0; 
           
          }
    }
    //store result in database ie update submittedResult as already have reference of object can update without using findById and upadate
    submittedResult.status=status;
    submittedResult.testCasesPassed=testCasesPassed;
    submittedResult.errorMessage=errorMessage;
    submittedResult.runtime=runtime;
    submittedResult.score=currentSubmissionScore;
    submittedResult.memory=memory;
    await submittedResult.save();
    //in user's solved problem also save problem id if already not there
    //req.result===user information
 let participantScore = await ContestParticipantScore.findOne({ userId, contestId });
      if (!participantScore) {
            // First submission for this user in this contest
            participantScore = await ContestParticipantScore.create({
                userId,
                contestId,
                totalScore: 0, // Initialize
                problemScores: new Map(), // Initialize empty map
            });
        }
         const currentProblemBestScore = participantScore.problemScores.get(problemId.toString()) || 0;
        //for updating user net score 
        const person=await User.findById(userId);


     
        if (currentSubmissionScore > currentProblemBestScore) {
            // Update if this submission is better than the previous best for this problem
            const oldTotalScore = participantScore.totalScore;
            person.totalScore+=currentSubmissionScore;
            await person.save();
            participantScore.problemScores.set(problemId.toString(), currentSubmissionScore);
            // Recalculate total score based on the updated problemScores map
            participantScore.totalScore = Array.from(participantScore.problemScores.values()).reduce((sum, score) => sum + score, 0);
            
            await participantScore.save();
            console.log(`Updated participant score. Old total: ${oldTotalScore}, New total: ${participantScore.totalScore}`);
        } else {
            console.log("Submission score not better than current best for this problem. No change to total score.");
        }

    //frontend response
    // const accepted=(status==="accepted");
    //if accepted true all test case accepted
    res.status(200).json({
     status,
     totalTestCases:submittedResult.totalTestCases,
     passedTestCases:submittedResult.testCasesPassed||0,
     runtime,
     memory
    });
    
    
    }
    catch(err){
    res.status(500).send("Internal server error:"+err);
    }
}
const submissionhistory=async(req,res)=>{
try{
    // console.log("hello123x");
        const userId=req.result._id;
        const {problemId,contestId}=req.params;
       const ans=await ContestSubmission.find({userId,problemId,contestId});
      //  console.log("answer is "+ans);
        if(ans.length===0){
         res.status(200).send("No Submission Is Present");
         return;
        }
         
       res.status(200).send(ans);
  }
  catch(err){
    console.log("hi");
  res.status(500).json({
    "message":"Internal Server error"
  });
  }
}
const result=async(req,res)=>{
    //require contest id and user id for fetching the data
    // console.log("hi")
    //req to send to frontend 
    //totalScore,rank,problemsSolved array with an extra key problemMaxScore
    //totalNoOfParticipants
    const userId=req.result._id;
    const {contestId}=req.params;
    ///finding data of contest for user
    const contestData= await ContestParticipantScore.findOne({contestId,userId});
    // console.log(contestData);
    
    //////////////////getting solved problems from id which is in key of map in an array and adding an extra key to problem obj problemMaxScore
    // const getMaxScore=(difficulty)=>{
    //     if(difficulty==="hard")
    //         return 100;
    //     if(difficulty==="medium")
    //         return 50;
    //     else
    //         return 20
    // } 
//   console.log(contestData);
     let solvedProblems = 0;

// If contestData.problemScores is a Mongoose Map:
const solvedIds=[]
    for (const [problemId, score] of contestData.problemScores.entries()) {
    if (score >= 20) {
        solvedProblems++;
    }
    solvedIds.push(problemId);
}

    // console.log(contestId);
    let totalProblemsIds=await Contest.findById(contestId);
    totalProblemsIds=totalProblemsIds.problems;
    // console.log(totalProblemsIds)
        const AllProblems = await Problem.find({ _id: { $in: totalProblemsIds } });
        const solvedIdsSet = new Set(solvedIds); // Faster lookup

const AllProblemsWithScore = AllProblems.map(problem => {
  let userScore = 0;

  if (solvedIdsSet.has(problem._id.toString())) {
    if (problem.difficulty === 'hard') userScore = 100;
    else if (problem.difficulty === 'medium') userScore = 50;
    else userScore = 20;
  }

  return {
    ...problem.toObject(), // Convert Mongoose document to plain object
    userScore
  };
});

    // console.log(AllProblems)
    const totalProblems=AllProblems.length;
    //getting total participants of a contest simply countDocuments with same contestId
    const totalNoOfParticipants=await ContestParticipantScore.countDocuments({contestId});

    //getting rank of user 
      let rank = await ContestParticipantScore.countDocuments({contestId,totalScore:{$gt:contestData.totalScore}});
    //   console.log("rank is ",rank);
    
    //

    rank=rank+1;
    const totalScore=contestData.totalScore;
    res.status(200).send({rank,totalScore,solvedProblems,totalNoOfParticipants,AllProblemsWithScore,totalProblems});

}
module.exports={createContest,getAllContest,registerContest,getContestById,submit,submissionhistory,result}