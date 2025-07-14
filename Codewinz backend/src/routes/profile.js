const express=require("express");
const profileRouter=express.Router();

const userMiddleware=require("../middleware/userMiddleware")



const {generateUploadSignature,profileUpload,deleteprofile}=require("../controllers/userProfile")

//getting signature for validating upload of pic
profileRouter.get('/create',userMiddleware,generateUploadSignature);
//saving profileRouter
profileRouter.post("/save",userMiddleware,profileUpload);
//deleting profileRouter
profileRouter.delete('/delete',userMiddleware,deleteprofile);


module.exports=profileRouter;