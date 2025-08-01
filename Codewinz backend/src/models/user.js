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
   rating: {
  type: String,
  enum: [
    'Human',
    'Super Saiyan',
    'Super Saiyan 2',
    'Super Saiyan 3',
    'Super Saiyan God',
  ],
  default:"Human",
  
},

totalScore:{
    type:Number,
    default:0,
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

},{timestamps:true});
function getRatingFromScore(score) {
  if (score >= 2000) return 'Ultra Instinct';
  if (score >= 1500) return 'Super Saiyan God';
  if (score >= 1000) return 'Super Saiyan 3';
  if (score >= 600) return 'Super Saiyan 2';
  if (score >= 300) return 'Super Saiyan';
  return 'Human';
};
userSchema.pre('save', function (next) {
  this.rating = getRatingFromScore(this.totalScore);
  next();
});
userSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();

  let newScore;
  if (update.totalScore !== undefined) {
    newScore = update.totalScore;
  } else if (update.$set && update.$set.totalScore !== undefined) {
    newScore = update.$set.totalScore;
  }

  if (newScore !== undefined) {
    const newRating = getRatingFromScore(newScore);
    if (!update.$set) update.$set = {};
    update.$set.rating = newRating;
  }
  next();
});


//creating mongoose module of this schema (basically collection ie table) of name user
const User=mongoose.model("user",userSchema);
module.exports=User;