const mongoose=require("mongoose");
const {Schema}=mongoose;

//creating schema for user 
const userSchema=new Schema({
    firstName:{
        type:String,
        required:true,
        minLength:2,
        maxLenght:20
    },
     loginMethod: {
      type: String,
       enum: ["email", "google"],
      required: true,
      default: "email"
      },

    lastName:{
        type:String,
        minLength:3,
        maxLenght:20
    },
    emailId:{
        type:String,
        required:true,
        trim:true,
        lowercase:true,
        immutable:true
    },
    age:{
        type:Number,
        min:6,
        max:80,
    },
    // In your user schema
heatmap: {
  type: Map,
  of: Number,
  default: {}
},
topics: {
  type: Map,
  of: Number,
  default: {}
},
    role:{
        type:String,
        enum:['user','admin'],
        default:'user'
    },
    problemSolved:{
        type:[
            {
                type:Schema.Types.ObjectId,
                ref:"problem",

            },    
        ],
        //  unique:true,
    },
    password:{
        type:String,
        required:true
    },
    profile:{
        url:{
            type:String,
            default:"/assets/user.png"
        },
        cloudinaryPublicId:{
            type:String,
        }
    },
    loginStreak: {
  type: Number,
  default: 0,
    },
lastLoginDate: {
  type: Date,
},

},{timestamps:true})

//creating mongoose module of this schema (basically collection ie table) of name user
const User=mongoose.model("user",userSchema);
module.exports=User;