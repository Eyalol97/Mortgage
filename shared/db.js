import mongoose from 'mongoose';
import env from './env.js';

mongoose.connect(env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });

export default mongoose;
