//used to check weather admin accessing the api or not
const jwt=require("jsonwebtoken");
const User = require("../models/user");
const redisClient=require("../config/redis")
const adminMiddleware=async(req,res,next)=>{
    //from jwt token of the admin who is registering someone we check this 
    try{
        //its gonna check weather the token we got is valid or not 
        const{token}=req.cookies;
        if(!token)
            throw new Error("Token is not present");
        const payload=jwt.verify(token,process.env.JWT_KEY);
        const {id}=payload;
        if(!id)
         throw new Error("Invalid token");

        const result=await User.findById(id);
        if(!result)
            throw new Error("User Dosen't Exist");
        //Redis ke blocklist mai check kringe token hai to nhi

        const IsBlocked=await redisClient.exists(`token:${token}`);

        if(IsBlocked)
            throw new Error("Invalid Token");

        //if token not in blocklist means can perform operations on it hence pass it details to further checkpoints by binding in req
        // if(result.role!=='admin'){
        //     console.log(result.role);
        //   throw new Error("Invalid Token");
        // }
            
        req.result=result;
        next();
    }
    catch(err){
        res.status(401).send("Error:"+err.message);
    }
}
module.exports=adminMiddleware;