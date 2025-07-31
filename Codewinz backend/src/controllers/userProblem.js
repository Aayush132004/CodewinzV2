const {getLanguageById,submitBatch,submitToken}=require("../utils/problemUtility")
const Problem=require("../models/problem");
const Submission=require("../models/submission");
const SolutionVideo= require("../models/solutionVideo");
async function checkRefSolution(req,res){
  const{title,description,difficulty,tags,visibleTestCases,hiddenTestCases,startCode,referenceSolution,problemCreator}=req.body
  for(const {language,completeCode} of referenceSolution){
//these format things require to send to JUDGE0
 //source_code
 //language_id
 //stdin
 //expected_output

const languageid=getLanguageById(language);
//will create a submission array for batch submission we are creating separate batch for each language can even create a single including all languages also in batch 
const submissions=visibleTestCases.map((testcase)=>({
    source_code:completeCode,
    language_id:languageid,
    stdin:testcase.input,
    expected_output:testcase.output
}))


  
  //submitbatch to JUDGE0
  const submitResult=await submitBatch(submissions);
   //taking all tokens in an array as for next get request req to give token one after other 
   const resultToken=submitResult.map((value)=>value.token);
   //get final result
   const testResult=await submitToken(resultToken);
 //test result have submissions data 

 //we will see if any testcase have status_id>3 means error in reference code and predefined ans of test cases hence wont able to create that peoblem and end fn here 
//  console.log(testResult)
// console.log(testResult);
 for(const test of testResult){
    if(test.status_id!==3){
     
        return res.status(400).send("Error Occured:");
    }
    //can even specify error for different status id ie runtime,sigsegv etc
    }

  }
}
const createProblem=async (req,res)=>{
const {title,description,difficulty,tags,visibleTestCases,hiddenTestCases,startCode,referenceSolution,problemCreator}=req.body;


try{
   checkRefSolution(req,res);
  //checked for all languages hence now can store data in database ie can create problem

    await Problem.create(
        {
        ...req.body,
          //in problem creator storing id of admin as passed through its middleware and in its middleware attached its obj in result hence added admin reference in it 
        problemCreator:req.result._id
    }
   
);
 res.status(201).send("Problem Saved Successfully");
}
catch(e){
 res.status(400).send("Error"+e)
}
}
///////////////////////////////////////
const updateProblem=async(req,res)=>{
  //find the problem check reference solution in judge0 update whole to solution
 const {id}=req.params
 try{
  
  // checkRefSolution(req);
  //once checked reference Solution now can update problem
  if(!id)
    return res.status(400).send("Missing ID Field");
  const DsaProblem=await Problem.findById(id);
  if(!DsaProblem)
    return res.status(404).send("ID is not present in database");
  
 const newProblem= await Problem.findByIdAndUpdate(id,{...req.body},{runValidators:true,new:true});
 res.status(200).send(newProblem)
 }
 catch(err){
  res.status(500).send("Error:"+err);
 }
}
/////////////////////////////////////
const deleteProblem=async(req,res)=>{
  const {id}=req.params;
  try{
    if(!id)
      return res.status(400).send("Missing ID Field");
    const DsaProblem=await Problem.findById(id);
    if(!DsaProblem)
      if(!id)
      return res.status(400).send("Problem is not available in Database");
    const deletedProblem= await Problem.findByIdAndDelete(id);
       //this problem wont come as already checked but for other way id not checked above
    if(!deletedProblem)
       return res.status(400).send("Problem is not available in Database");
    return res.status(200).send("Successfully deleted")

  }
  catch(err){
    res.status(500).send("Error:"+err);
  }
  
    
}
/////////////////////////////////////

const getProblemById=async(req,res)=>{
  const {id}=req.params;
  try{
  
      if(!id)
      return res.status(400).send("Missing ID Field");
    const DsaProblem=await Problem.findById(id).select(" _id title description difficulty tags visibleTestCases referenceTestCases startCode referenceSolution hiddenTestCases");
    if(!DsaProblem)
      if(!id)
      return res.status(400).send("Problem is not available in Database");
        
    //finding video soln 
    const video=await SolutionVideo.findOne({problemId:id});
    // console.log(video);
    //if got send its url and data attaching to dsaproblem else normal response 
    if(video) {
      // console.log("check2")
      //here only can check agr user.paid==true then only run this if statement else dont send video url to user 
      const responseData={
      ...DsaProblem.toObject(),
      secureUrl:video.secureUrl,
      duration:video.duration,
       thumbnailUrl:video.thumbnailUrl
      }
    //  console.log(responseData)
      return res.status(200).send(responseData);
    }

   
   return res.status(200).send(DsaProblem);
  }
  catch(err){
   res.status(404).send("Error:"+err);
  }
}
////////////////////////////////////
const getAllProblem=async(req,res)=>{
  try{
    //pagination
    const limit=Number(req.query.limit)||4;
    const currentPage=Number(req.query.page)||1;
    const skip=(currentPage-1)*limit;
    const totalProblems=await Problem.countDocuments()
    const totalPage=Math.ceil(totalProblems/limit);

     const allProblems=await Problem.find({}).select("_id difficulty  tags title").skip(skip).limit(limit);
     if(allProblems.length==0)
     return res.status(404).send("No Problems are there");
    // console.log(allProblems);

    return res.status(200).send({allProblems,totalPage,currentPage});
  }
  catch(err){
      res.status(404).send("Error:"+err);
  } 
}
//////////////////////////////////////////
const solvedAllProblembyUser=async(req,res)=>{
   //in req.result we have user object got from token (cookie) via user middleware
   try{
      req.result=await req.result.populate({
      path:"problemSolved",
      select:"title difficulty tags _id"
       });
      res.status(200).send(req.result.problemSolved);
   }
   catch(err){
    res.status(404).send("Error:"+err);
   }
   
   
}
/////////////////////////////////////////////////
const submittedProblem=async(req,res)=>{
  try{
    // console.log("hello123x");
        const userId=req.result._id;
        const problemId=req.params.pid;
     

       const ans=await Submission.find({userId,problemId});
      //  console.log("answer is "+ans);
        if(ans.length===0){
         res.status(200).send("No Submission Is Present");
         return;
        }
         
       res.status(200).send(ans);
  }
  catch(err){
  res.status(500).send("Internal Server Error");
  }
}
module.exports={createProblem,updateProblem,deleteProblem,getProblemById,getAllProblem,solvedAllProblembyUser,submittedProblem};



