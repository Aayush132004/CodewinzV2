const cloudinary = require('cloudinary').v2
const Problem=require('../models/problem');
const SolutionVideo=require('../models/solutionVideo');

//FIRST REQ TO CONFIGURE CLOUDINARY
cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
})
const generateUploadSignature=async(req,res)=>{

try{
//getting problemId and userId from req
const userId=req.result._id;
const {problemId}=req.params;

//verifying if problem exists 
const problem=await Problem.findById(problemId);
if(!problem)
    return res.status(404).json({
error:"Problem not found"});

//if exists than generating digital signature
//time of as upload exists for an hr only 
//public id to name video 
const timestamp=Math.round(new Date().getTime()/1000);
const public_id=`codewinz-solutions/${problemId}/${userId}_${timestamp}`;

//upload parameters 
//can send more too
const uploadParams={
    timestamp:timestamp,
    public_id:public_id,
};

//sending digital signature made on uploadParams we send this signature and upload params than clousindary server can verify them by taking these params and generating its signature with private key that it also have and mathcing with our sended signature 

//GENERATING SIGN
const signature=cloudinary.utils.api_sign_request(
    uploadParams,
    process.env.CLOUDINARY_API_SECRET
);

//sending sign&uploadparams data to frontend

res.json({
    signature,
    timestamp,
    public_id,
    api_key:process.env.CLOUDINARY_API_KEY,
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    upload_url:`https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload`


});
}
catch(err){
    console.error('Error generating upload signature :',err);
    res.status(500).json({error:'failed to generate upload credential'});
}
};

const saveVideoMetadata=async(req,res)=>{

try{
    const{
        problemId,
        cloudinaryPublicId,
        secureUrl,
        duration,
    }=req.body;
    const userId=req.result._id;

  //verify the upload in cloudinary so that these data that frontend send to me is of actual uploaded video not random trash
  const cloudinaryResource=await cloudinary.api.resource(
    cloudinaryPublicId,
    {resource_type:'video'}
  );
  //in cloudinaryResource if there now get whole video data
  if(!cloudinaryResource)
    return res.status(400).json({error:'Video not found on Cloudinary'});


//if video meta data already there in database user mistakingly send req again
const existingVideo=await SolutionVideo.findOne({
    problemId,
    userId,
    cloudinaryPublicId

});
if(existingVideo){
    return res.status(409).json({error:"Video already exists"});
}

//thumbnail url creating on the go with public_id similarly can even do for video url
const thumbnailUrl=cloudinary.url(cloudinaryResource.public_id, {
  resource_type: "video",
  format: "jpg",
transformation:[
    {start_offset:'4'},

]})

//creating record in our DB
const videoSolution= await SolutionVideo.create({
    problemId,
    userId,
    cloudinaryPublicId,
    secureUrl,
    duration:cloudinaryResource.duration||duration,
    thumbnailUrl
});
res.status(201).json({
    message:'Video solution saved successfully',
    videoSolution:{
        id:videoSolution._id,
        thumbnailUrl:videoSolution.thumbnailUrl,
        duration:videoSolution.duration,
        uploadedAt:videoSolution.createdAt
    }
});

}
catch(err){
    console.error('Error saving video metadata:',err);
    res.status(500).json("Failed to save video metadata");
}

};

const deleteVideo=async(req,res)=>{
    try{
        // console.log("holaaa")
        //can delete direct by problem id instead of taking video id as that be convinent and and good as one video for a problem 
        // const{videoId}=req.params;
        const {problemId}=req.params;
        const userId=req.result._id;
        // const video=await SolutionVideo.findBYIdAndDelete(videoId);
          const video=await SolutionVideo.findOneAndDelete({problemId:problemId});
        if(!video)
            return res.status(404).json({
        error:"Video not found"});
          
        //deleting video directly using cloudinary sdk kit configured above
        await cloudinary.uploader.destroy(video.cloudinaryPublicId,{resource_type:'video',invalidate:true});

       //why are we using invalidate:true???
        res.json({message:'Video deleted successfully'});
    }
    catch(err){
        console.error('Error deleting video:',err);
        res.status(500).json({error:'Failed to delete video'});
    }
}

module.exports={generateUploadSignature,saveVideoMetadata,deleteVideo};