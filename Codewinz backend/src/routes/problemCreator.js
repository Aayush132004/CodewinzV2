const express=require("express");
const problemRouter=express.Router();
const adminMiddleware=require("../middleware/adminMiddleware"); 
const userMiddleware=require("../middleware/userMiddleware")
const {createProblem,updateProblem,deleteProblem,getProblemById,getAllProblem,solvedAllProblembyUser,submittedProblem,getAllProblemwithoutlimit}=require("../controllers/userProblem")
//Create
//update
//delete
//require admin access ie pass through admin middleware
problemRouter.post("/create",adminMiddleware,createProblem);
problemRouter.put("/update/:id",adminMiddleware,updateProblem);
problemRouter.delete("/delete/:id",adminMiddleware,deleteProblem);


// //fetch
// //fetch all problem
// //fetch solved by particular user
// //dont need admin access only user as valid user or not 
problemRouter.get("/problemSolvedByUser",userMiddleware,solvedAllProblembyUser);
problemRouter.get("/problemById/:id",userMiddleware,getProblemById);
problemRouter.get("/getAllProblem",userMiddleware,getAllProblem);
problemRouter.get("/getAllProblemwithoutlimit",userMiddleware,getAllProblemwithoutlimit);
//to get submission of a problem solved by user
problemRouter.get("/submittedProblem/:pid",userMiddleware,submittedProblem)





module.exports=problemRouter;
