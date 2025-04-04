import mongoose from 'mongoose';
import { log } from './vite';

// MongoDB connection string - using environment variable if available
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/task_manager';

// Connect to MongoDB
export async function connectToDatabase() {
  try {
    await mongoose.connect(MONGO_URI);
    log('Connected to MongoDB successfully', 'mongodb');
    return mongoose.connection;
  } catch (error) {
    log(`MongoDB connection error: ${error}`, 'mongodb');
    process.exit(1);
  }
}

// Get the MongoDB connection
export const getConnection = () => mongoose.connection;