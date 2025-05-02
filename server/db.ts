import mongoose from 'mongoose';
import { log } from './vite'; // your custom logger

const MONGO_URI = 'mongodb://anas:12345@ac-orz1qmn-shard-00-00.dr8giip.mongodb.net:27017,ac-orz1qmn-shard-00-01.dr8giip.mongodb.net:27017,ac-orz1qmn-shard-00-02.dr8giip.mongodb.net:27017/testdb?ssl=true&replicaSet=atlas-peijba-shard-0&authSource=admin&retryWrites=true&w=majority';


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
