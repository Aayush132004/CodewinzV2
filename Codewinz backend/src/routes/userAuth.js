const express=require("express");
const authRouter=express.Router();
const userMiddleware=require("../middleware/userMiddleware")
const adminMiddleware=require("../middleware/userMiddleware")
const {register,login,logout,adminRegister,deleteProfile,googleLogin,sendMail,verifyMail}=require("../controllers/userAuthent");
const problems=require("../models/problem")
//Register
//Login{admin or normal user}
//Logout
authRouter.post("/register",register);
//normal login
authRouter.post("/login",login);
//google login
authRouter.post("/googleLogin",googleLogin);
//mail login
authRouter.post("/mailLogin",sendMail);
authRouter.post("/verifyMail",verifyMail);
//mail login get req to access //no need i will send to login only direct 

//before logout and all checking weather the jwt we have now is valid or not 
authRouter.post("/logout",userMiddleware,logout);
authRouter.post("/admin/register",adminMiddleware,adminRegister);
authRouter.delete('/profile',userMiddleware,deleteProfile)
authRouter.get('/profile',userMiddleware,async(req,res)=>{
  try{
const user=req.result;
const lastName=""
if(user.lastName){
  lastName=user.lastName
}
const reply={
  name:user.firstName+" "+ lastName,
  email:user.emailId,
  profile:user.profile.url,
  questionsSolved:user.problemSolved.length,
  totalQuestions: await problems.countDocuments({}),

}
res.status(200).send(reply);
  }
  catch(err){
    res.send("Error fetching user profile");
  }
})
authRouter.get("/check",userMiddleware,async(req,res)=>{
  const reply={
    firstName:req.result.firstName,
    emailId:req.result.emailId,
    _id:req.result._id,
    role:req.result.role,
    profile:req.result?.profile?.url,
  }
  res.status(200).json({
    user:reply,
    message:"Valid User"
  })
})
// authRouter.get("/getprofile",getprofile);

//GetProfile
module.exports=authRouter;