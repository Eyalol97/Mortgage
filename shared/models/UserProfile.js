import mongoose from '../db.js';

const userProfileSchema = new mongoose.Schema(
  {
    user_id: {
      type:     mongoose.Schema.Types.ObjectId,
      required: true,
      unique:   true,
      ref:      'User',
    },
    net_income: {
      type: Number,
      min:  0,
    },
    equity: {
      type: Number,
      min:  0,
    },
    monthly_savings: {
      type: Number,
      min:  0,
    },
    household_size: {
      type:      Number,
      min:       1,
      validate:  {
        validator: Number.isInteger,
        message:   'household_size must be a positive integer',
      },
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

export default mongoose.model('UserProfile', userProfileSchema);
