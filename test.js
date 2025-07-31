const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  totalScore: {
    type: Number,
    default: 0,
  },
  rating: {
    type: String,
    enum: [
      'Human',
      'Super Saiyan',
      'Super Saiyan 2',
      'Super Saiyan 3',
      'Super Saiyan God',
      'Ultra Instinct',
    ],
    default: 'Human',
  },
});

// ⭐ Function to determine rating from score
function getRatingFromScore(score) {
  if (score >= 2000) return 'Ultra Instinct';
  if (score >= 1500) return 'Super Saiyan God';
  if (score >= 1000) return 'Super Saiyan 3';
  if (score >= 600) return 'Super Saiyan 2';
  if (score >= 300) return 'Super Saiyan';
  return 'Human';
}

// ⬇️ Pre-save hook for .save()
userSchema.pre('save', function (next) {
  this.rating = getRatingFromScore(this.totalScore);
  next();
});

// ⬇️ Pre-update hook for findOneAndUpdate()
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

const User = mongoose.model('User', userSchema);
module.exports = User;
