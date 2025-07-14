const mongoose=require("mongoose");
const {Schema}=mongoose;

const submissionSchema=new Schema({
    userId:{
        type:Schema.Types.ObjectId,
        ref:'user',
        required:true
    },
    problemId:{
         type:Schema.Types.ObjectId,
        ref:'problem',
        required:true
    },
    code:{
        type:String,
        required:true,
    },
    language:{
        type:String,
        enum:["javascript","java","c++"],
        required:true,
    },
    status:{
        type:String,
        enum:["pending","accepted","wrong","error"],
        default:"pending",
        index:true,
    },
    runtime:{
        type:Number,//millisecond
        default:0
    },
    memory:{
        type:Number,//kB
        default:0
    },
    errorMessage:{
        type:String,
        default:''
    },
    testCasesPassed:{
        type:Number,
        default:0,
    },
    totalTestCases:{
        type:Number,
        default:0
    }
},{timestamps:true});

submissionSchema.index({userId:1,problemId:1});

 
const Submission=mongoose.model("submission",submissionSchema);

module.exports=Submission;