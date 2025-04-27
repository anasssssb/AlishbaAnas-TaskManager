import mongoose from 'mongoose';
import { log } from './vite';

// MongoDB connection string
const MONGO_URI = process.env.MONGODB_URI || 
  'mongodb+srv://anas_1:bhatti8505@cluster0.9cghgrp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Connect to MongoDB
export async function connectToDatabase() {
  try {
    mongoose.set('strictQuery', false);

    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });

    if (mongoose.connection.readyState !== 1) {
      throw new Error('Failed to connect to MongoDB');
    }

    log('Connected to MongoDB successfully', 'mongodb');
    return mongoose.connection;
  } catch (error) {
    log(`MongoDB connection error: ${error}`, 'mongodb');

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
  return mongoose.connection || null;
};
