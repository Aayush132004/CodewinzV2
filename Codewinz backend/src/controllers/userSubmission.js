const Problem=require("../models/problem");
const Submission=require("../models/submission");
const User=require("../models/user");
const {getLanguageById,submitBatch,submitToken}=require("../utils/problemUtility");
const submitCode=async(req,res)=>{
try{
    // console.log(res)
    //userId through its middleware
    const userId=req.result._id;
    //problemId sending via param
    const problemId=req.params.id;
    //code and language we take from frontend
    const {code,language}=req.body;
    //from frontend sending cpp as monaco does so chaning here
    if(language==='cpp')
        language='c++'
    const user=await User.findById(userId); 
    if(!userId||!problemId||!code||!language)
        return res.status(400).send("Some field missing");

    //fetch problem from database then run in judge0 to get rest data for our submission ie testcases and all
    const problem=await Problem.findById(problemId);
    //testcases(hidden)we got 

    //have now two choices
    //1) send code to judge0 and result when came store in database
    //2) store in database with status code of pending and when result come from judge0 update it in database

    //second one better as if server of judge0 got error and gave no result and in submissions also it wont show even submitted by frontend hence user experience will reduce hence use second approach ie maintain the state before hand only of the submission with pending status and when judge0 or some external API give result update it hence no data loss history maintain

    const submittedResult=await Submission.create({
      userId,
      problemId,
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
// console.log("chck2",testResult)
//update SubmittedResult of database
//for it see what things come as output in testResult can do console log in createProblem one or even here 

let memory=0;
let status='accepted';
let errorMessage=null;
let runtime=0;
let testCasesPassed=0;

// Status mapping for Judge0

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

// Example usage:

// console.log('check1')


for(const test of testResult){
    if(test.status_id==3){
        testCasesPassed++;
        runtime=runtime+parseFloat(test.time);
        memory=Math.max(memory,test.memory);
        // Update heatmap with today's date
        const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
        user.heatmap.set(today, (user.heatmap.get(today) || 0) + 1);
          // Update topics
        // Update topics - handling both array and single topic cases
        if (problem.tags && Array.isArray(problem.tags)) {
          problem.tags.forEach(topic => {
            if (topic) { // Ensure topic exists
              user.topics.set(topic, (user.topics.get(topic) || 0) + 1);
            }
          });
        } else if (problem.tags) { // If single topic field exists
          user.topics.set(problem.tags, (user.topics.get(problem.tags) || 0) + 1);
        }
        await user.save();
        await problem.save();
    }
   else {
     status=getErrorByID(test.status_id);
    }
}
//store result in database ie update submittedResult as already have reference of object can update without using findById and upadate
submittedResult.status=status;
submittedResult.testCasesPassed=testCasesPassed;
submittedResult.errorMessage=errorMessage;
submittedResult.runtime=runtime;
submittedResult.memory=memory;
await submittedResult.save();
//in user's solved problem also save problem id if already not there
//req.result===user information
if(!req.result.problemSolved.includes((problemId))){
    req.result.problemSolved.push(problemId);
    await req.result.save();
}

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
 
res.status(500).json({
  "message":err.message});
}
}


const runCode=async(req,res)=>{
    try{
     //userId through its middleware
    const userId=req.result._id;
    //problemId sending via param
    const problemId=req.params.id;
    //code and language we take from frontend
    const {code,language}=req.body;
    if(language==="cpp")
        language='c++'
    if(!userId||!problemId||!code||!language)
        return res.status(400).send("Some field missing");

    //fetch problem from database then run in judge0 to get rest data for our submission ie testcases and all
    const problem=await Problem.findById(problemId);
    
    //testcases(hidden)we got 

    //have now two choices
    //1) send code to judge0 and result when came store in database
    //2) store in database with status code of pending and when result come from judge0 update it in database

    //second one better as if server of judge0 got error and gave no result and in submissions also it wont show even submitted by frontend hence user experience will reduce hence use second approach ie maintain the state before hand only of the submission with pending status and when judge0 or some external API give result update it hence no data loss history maintain

   

    //submit code to judge0
    const languageId=getLanguageById(language);
    const submission=problem.visibleTestCases.map((testcase)=>({
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

let memory=0;
let status='accepted';
let runtime=0;


for(const test of testResult){
    if(test.status_id==3){
        runtime=runtime+parseFloat(test.time);
        memory=Math.max(memory,test.memory);
    }
    else{   
         status=getErrorByID(test.status_id);
    }
}

// console.log(testResult);

res.status(200).json({
    status,
    runtime,
    memory,
    testCases:testResult,
});
}
catch(err){
res.status(500).send("Internal server error:"+err);
}
}




module.exports={submitCode,runCode}