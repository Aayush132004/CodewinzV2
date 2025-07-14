const User=require("../models/user");
const cloudinary = require('cloudinary').v2


cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
})


///////////////////////////////////////
const generateUploadSignature=async(req,res)=>{

try{


//getting userId from req
const userId=req.result._id;

//verifying if problem exists 


//if exists than generating digital signature
//time of as upload exists for an hr only 
//public id to name video 
const timestamp=Math.round(new Date().getTime()/1000);
const public_id=`codewinz-solutions/${userId}/${timestamp}`;

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

res.status(200).json({
    signature,
    timestamp,
    public_id,
    api_key:process.env.CLOUDINARY_API_KEY,
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    upload_url:`https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`


});
}
catch(err){
    console.error('Error generating upload signature :',err);
    res.status(500).json({error:'failed to generate upload credential'});
}
}


///////////////////////////////
const profileUpload=async(req,res)=>{

    try{
    console.log("hi")
    const{
        cloudinaryPublicId,
        secureUrl,
    }=req.body;
    const userId=req.result._id;

  //verify the upload in cloudinary so that these data that frontend send to me is of actual uploaded video not random trash
  const cloudinaryResource=await cloudinary.api.resource(
    cloudinaryPublicId,
    {resource_type:'image'}
  );
  //in cloudinaryResource if there now get whole video data
  if(!cloudinaryResource)
    return res.status(400).json({error:'Profile not found on Cloudinary'});


//if video meta data already there in database user mistakingly send req again
const existingImage=await User.findOne({
    profile:{
        url:secureUrl,
        cloudinaryPublicId:cloudinaryPublicId
    }
});

if(existingImage){
    return res.status(409).json({error:"Profile already exists"});
}



//creating record in our DB modified one and providing the data to frontend
const userProfile= await User.findById(userId);
userProfile.profile.url=secureUrl;
userProfile.profile.cloudinaryPublicId=cloudinaryPublicId;
await userProfile.save();


res.status(201).json({
    message:'Profile saved successfully'
});

}
catch(err){
    console.error('Error saving profile metadata:',err);
    res.status(500).json("Failed to save profile metadata");
}

}
////////////////////////////////

const deleteprofile=async(req,res)=>{

}

module.exports={generateUploadSignature,profileUpload,deleteprofile}