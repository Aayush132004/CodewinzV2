const express=require("express");
const aiRouter=express.Router();
const userMiddleware=require("../middleware/userMiddleware");
const solveDoubt=require("../controllers/solveDoubt");
const chatStream=require("../middleware/chatStream");


aiRouter.post('/chat',solveDoubt);

module.exports=aiRouter;
