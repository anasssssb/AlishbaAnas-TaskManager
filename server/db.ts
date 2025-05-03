import mongoose from 'mongoose';
import { log } from './vite'; // your custom logger

const MONGO_URI = process.env.MONGODB_URI || '';

export async function connectToDatabase() {
  try {
    mongoose.set('strictQuery', false);

    await mongoose.connect(MONGO_URI, {
      dbName: 'testdb', // ✅ Explicitly force dbName
      serverApi: {
        version: '1',
        strict: true,
        deprecationErrors: true,
      },
      ssl: true,
      serverSelectionTimeoutMS: 10000,
    });

    log('✅ Connected to MongoDB successfully', 'mongodb');
    return mongoose.connection;
  } catch (error) {
    log(`❌ MongoDB connection error: ${error}`, 'mongodb');
    console.error('❌ Full MongoDB Error:', error);

    try {
      await mongoose.disconnect();
    } catch (disconnectError) {
      log(`⚠️ Error during mongoose disconnect: ${disconnectError}`, 'mongodb');
    }

    return null;
  }
}

export const getConnection = () => {
  return mongoose.connection || null;
};
