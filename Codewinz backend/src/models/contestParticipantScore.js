// models/contestParticipantScore.js
const mongoose = require('mongoose');
const {Schema}=mongoose;

const contestParticipantScoreSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
  contestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'contest',
    required: true,
  },
  totalScore: {
    type: Number,
    default: 0,
  },
  // This will store the best score for each problem
  // Key: problemId (as a string), Value: bestScore for that problem
  problemScores: {
    type: Map,
    of: Number,
    default: {},
  },
}, { timestamps: true });

contestParticipantScoreSchema.index({ userId: 1, contestId: 1 }, { unique: true });

const ContestParticipantScore = mongoose.model('ContestParticipantScore', contestParticipantScoreSchema);

module.exports=ContestParticipantScore;