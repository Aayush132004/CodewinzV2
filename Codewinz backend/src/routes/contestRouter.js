const express=require("express");
const contestRouter=express.Router();
const adminMiddleware=require("../middleware/adminMiddleware"); 
const userMiddleware=require("../middleware/userMiddleware")
const{createContest,getAllContest,registerContest,getContestById,submit,submissionhistory,result }=require("../controllers/contest");

contestRouter.post("/create",adminMiddleware,createContest);
contestRouter.get("/getContest",userMiddleware,getAllContest);
contestRouter.get("/getContestById/:id",userMiddleware,getContestById);
contestRouter.put("/register/:id",userMiddleware,registerContest);
///////////for contestSubmission schema
contestRouter.post("/contestSubmission/submit/:problemId",userMiddleware,submit)
contestRouter.get("/contestSubmission/:contestId/:problemId",userMiddleware,submissionhistory)
contestRouter.get("/contestResult/:contestId",userMiddleware,result)

module.exports=contestRouter;