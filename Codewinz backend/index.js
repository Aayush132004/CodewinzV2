const express=require("express");
const app=express();
require("dotenv").config();
const main=require("./src/config/db");
const cookieParser = require('cookie-parser');
const userAuth=require("./src/routes/userAuth")
const redisClient=require("./src/config/redis")
const problemCreator=require("./src/routes/problemCreator")
const submit=require("./src/routes/submit")
const cors=require("cors");
const videoRouter=require('./src/routes/videoRouter');
const profileRouter=require("./src/routes/profile");
const aiRouter=require("./src/routes/aiChatting");
const contestRouter=require("./src/routes/contestRouter");
///solving cors issue by allowing our frontend
app.use(cors({
    origin:process.env.FRONTEND_URL,
    credentials:true,
     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept"]
}))


//middleware for parsing body json and cookie json data to js obj
app.use(express.json());
app.use(cookieParser());


app.get('/health', (req, res) => {
  res.status(200).send("Backend is live");
});

//user Auth API
app.use("/user",userAuth);
app.use("/problem",problemCreator)
app.use("/submission",submit);
app.use("/video",videoRouter);
app.use("/profile",profileRouter);
app.use("/ai",aiRouter);
app.use("/contest",contestRouter);



const InitializeConnection=async()=>{
    try{
        //connecting both database than will start server 
       await Promise.all([main(),redisClient.connect()]);
       console.log("DB Connected");
       //if any connection fail then error
       app.listen(process.env.PORT,()=>{
     console.log("listening on port "+ process.env.PORT);
 })
    }

   catch(err){
    console.log("Error:"+err);
   }
}
InitializeConnection();

// main()
// .then(()=>{
// app.listen(process.env.PORT,()=>{
//     console.log("listening on port "+ process.env.PORT);
// })
// })
// .catch(err=>console.log("Error Occured:"+err));