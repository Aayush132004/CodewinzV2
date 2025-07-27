const mongoose=require("mongoose");
const {Schema}=mongoose;

const ContestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  problems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'problem', 
   
  }],
  registeredUsers: [{ 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user', 
  }],
  status: {
    type: String,
    enum: ['upcoming', 'active', 'finished'],
    default: 'upcoming',
   
  },
 
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: false, 
  }
}, {
  timestamps: true 
});

const Contest=mongoose.model('contest',ContestSchema);
module.exports=Contest;