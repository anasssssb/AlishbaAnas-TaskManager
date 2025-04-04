import mongoose from 'mongoose';
import { log } from './vite';

// MongoDB connection string - using environment variable if available
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/task_manager';

// Connect to MongoDB with graceful fallback
export async function connectToDatabase() {
  try {
    if (!process.env.MONGODB_URI) {
      log('No MongoDB URI provided, using in-memory database', 'mongodb');
      return null;
    }
    
    // Configure mongoose to use new URL parser and unified topology
    mongoose.set('strictQuery', false);
    
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // Reduce timeout to 5 seconds
      socketTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    
    // Test connection by executing a simple command
    const isConnected = mongoose.connection.readyState === 1;
    if (!isConnected) {
      throw new Error('Failed to connect to MongoDB');
    }
    
    log('Connected to MongoDB successfully', 'mongodb');
    return mongoose.connection;
  } catch (error) {
    log(`MongoDB connection error: ${error}, falling back to in-memory storage`, 'mongodb');
    
    // Attempt to close the connection if it's in a problematic state
    try {
      await mongoose.disconnect();
    } catch (disconnectError) {
      log(`Error during mongoose disconnect: ${disconnectError}`, 'mongodb');
    }
    
    return null;
  }
}

// Get the MongoDB connection
export const getConnection = () => {
  try {
    return mongoose.connection;
  } catch (error) {
    return null;
  }
};