import mongoose from '../db.js';

const usageCounterSchema = new mongoose.Schema({
  feature: {
    type: String,
    required: true,
    enum: ['simulator', 'bot', 'profile'],
    unique: true,
  },
  count: {
    type: Number,
    default: 0,
    min: 0,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

// Atomically increments the counter for a feature, creating the record if it doesn't exist.
usageCounterSchema.statics.increment = function (feature) {
  return this.findOneAndUpdate(
    { feature },
    { $inc: { count: 1 }, $set: { lastUpdated: new Date() } },
    { upsert: true, new: true }
  );
};

export default mongoose.model('UsageCounter', usageCounterSchema);
