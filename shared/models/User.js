import mongoose from '../db.js';

const userSchema = new mongoose.Schema(
  {
    email: {
      type:     String,
      required: true,
      unique:   true,
      lowercase: true,
      trim:     true,
    },
    passwordHash: {
      type:     String,
      required: false, // not set for Google sign-in users
    },
    googleId: {
      type:   String,
      unique: true,
      sparse: true,   // allows multiple docs with no googleId
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

export default mongoose.model('User', userSchema);
