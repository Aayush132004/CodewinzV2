
const chatStream=async(req,res,next)=>{
 res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // Send headers immediately
  next();
};

module.exports=chatStream;