const User=require("../models/user");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validate=require("../utils/validate");
const redisClient = require("../config/redis");
const Submission=require("../models/submission")
const crypto=require("crypto");
//google-login
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const register=async(req,res)=>{
    try{
        //validate the data ie necessary thing there and rest validation
        // console.log(req.body);  
        // console.log("check1");
        validate(req.body);
        //done emailId unique so if already in DB dont need to check automatic error
        //before storing password hashing 
        const{password,emailId}=req.body;
        //////////////////////
        //not allowing google login method one to register
        const existingUser=await User.findOne({emailId});
        // console.log("check2");
        if(existingUser)
          if(existingUser.loginMethod==="google")
            throw new Error("This account was already created via Google. Please use Google Sign-In");
          else 
            throw new Error("User already registered");
        ////////////////////////////////////////////////////
        req.body.password=await bcrypt.hash(password,10);
        //role user fixed to that no one without authority can register as admin
        req.body.role="user";
        const user=await User.create(req.body);
        //once registered create a token for user directly and can access home or else can generate token only when do login so after register login req to do,am giving direct access 
      const token= jwt.sign({id:user._id,emailId:emailId,role:"user"},process.env.JWT_KEY,{expiresIn:60*60})//expiry setting an hour of token 
      // console.log("check3");
      res.cookie('token',token,{maxAge:60*60*1000});
      const reply={
        firstName:user.firstName,
        emailId:user.emailId,
        _id:user._id,
        role:user.role,
        profile:user.profile.url,
      }
      res.status(201).json({
        user:reply,
        message:"Successfully Registered"
      });
    }
    catch(err){
    console.log("check4");
    res.status(400).send("Error:"+err.message);
    }
}


const login=async(req,res)=>{
    try{
  
        const{emailId,password}=req.body;
        //if something not entered
        if(!emailId||!password)
            throw new Error("Invalid Credentials");
        //find user in db and check if given login details match 
        const user=await User.findOne({emailId});
        //user not exists
        if (!user) {
          throw new Error("User not found");
        }
        ////////////////////////////////////
        // if registered via google tell him
        if(user.loginMethod==="google")
          throw new Error("This account was created via Google. Please use Google Sign-In.")
        //////////////////////////////////

        const match=await bcrypt.compare(password,user.password)
        if(!match)
            throw new Error("Invalid Credentials");
        //if passwords matched create jwt token and return it to user
         const token= jwt.sign({id:user._id,emailId:emailId,role:user.role},process.env.JWT_KEY,{expiresIn:60*60})//expiry setting an hour of token 
      res.cookie('token',token,{maxAge:60*60*1000});
      const reply={
        firstName:user.firstName,
        emailId:user.emailId,
        _id:user._id,
        role:user.role,
        profile:user.profile.url,
      }
      // console.log(reply);
       res.status(201).json({
        user:reply,
        message:"Logged In Successfully"
      });

    }
    catch(e){
     res.status(400).send("Error"+e.message);
    }
}

const googleLogin=async(req,res)=>{
//token id from frontend

const {id_token}=req.body;

try{
  //verify token by google
  // console.log("check1");
  // got same token as frontend console.log(id_token)
  const ticket=await client.verifyIdToken({
    idToken:id_token,
    audience:process.env.GOOGLE_CLIENT_ID,
  });
 
  const payload=ticket.getPayload();
  // console.log(payload);
  const{email,name,picture,sub:googleId}=payload;
  // console.log("pic",picture)
  //checking if user exist will generate a jwt and send else error
  let user=await User.findOne({emailId:email});
   //user not exist throw error

   const randomPassword = await bcrypt.hash(crypto.randomUUID(), 10); // securely hashed random password


  if(!user){
    user=await User.create({
      firstName:name,
      emailId:email,
      role:"user",
      //for better experience placing google profile image as user on first register through google
      profile:{
        url:picture,
      },
      //something random so let be googletoken only
      password:randomPassword,
      loginMethod:"google"
    })
  }
  //user exist already generate jwt and give
  //if registered with mail let them use that
  if(user.loginMethod==="email")
    throw new Error("This email is already registered. Please login using email and password.")
// console.log("check2");
    const token= jwt.sign({id:user._id,emailId:email,role:user.role},process.env.JWT_KEY,{expiresIn:60*60})//expiry setting an hour of token 
      res.cookie('token',token,{maxAge:60*60*1000});
      const reply={
        firstName:user.firstName,
        emailId:user.emailId,
        _id:user._id,
        role:user.role,
        profile:user?.profile?.url,
      }
      // console.log(reply);
       res.status(201).json({
        user:reply,
        message:"Logged In Successfully"
      });



}
catch(err){
  res.status(401).send(err.message);
}
}

const logout=async(req,res)=>{
  try{
    //validate the token if its invalid only means already logged out
    //already validated token in middleware not log it out 
    const{token}=req.cookies;
    //we keep token in redis blocked only till token expiry that we can get from payload
    const payload=jwt.decode(token);
    await redisClient.set(`token:${token}`,'Blocked');
    await redisClient.expireAt(`token:${token}`,payload.exp);
    //else add token to redis blocklist
    //than clear the cookie from frontend
  res.cookie("token",null,{expires:new Date(Date.now())});
  res.send("Logged Out Successfully");
  }
  catch(err){
    //ERROR WILL COME ONLY FROM REDIS HERE AS ALREADY CHECK VALID TOKEN SO 503 
   res.status(503).send("Error:"+err.message);
  }

}
  const adminRegister=async(req,res)=>{
   try{
    validate(req.body);
    const{password,emailId}=req.body;
    req.body.password=await bcrypt.hash(password,10);
    req.body.role='admin';
    const user=await User.create(req.body);
    const token= jwt.sign({id:user._id,emailId:emailId,role:user.role},process.env.JWT_KEY,{expiresIn:60*60})
    res.cookie('token',token,{maxAge:60*60*1000});
    res.status(201).send("User Created Successfully");

   }
   catch(err){
     res.status(400).send("Error:"+err.message);
   }
  }

const deleteProfile=async(req,res)=>{
  try{
 const userId=req.result._id;
 await User.findByIdAndDelete(userId);
 //delete submissions by that user
 await Submission.deleteMany({userId});
 res.status(200).send("Deleted Successfully!");
  }
 catch(err){
  res.status(500).send("Internal Server Error")
 
 }
}
module.exports={register,login,logout,adminRegister,deleteProfile,googleLogin}