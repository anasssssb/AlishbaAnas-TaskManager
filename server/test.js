import { MongoClient, ServerApiVersion } from 'mongodb';

const uri = "mongodb+srv://anas:12345@cluster0.dr8giip.mongodb.net/testdb?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    console.log("🔌 Attempting to connect to MongoDB...");
    await client.connect();
    console.log("✅ Connected successfully to MongoDB");

    console.log("📡 Pinging MongoDB...");
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Pinged MongoDB successfully. Connection is good!");
  } catch (err) {
    console.error("❌ Error occurred during MongoDB operation:", err.message);
  } finally {
    try {
      await client.close();
      console.log("🔒 Connection to MongoDB closed.");
    } catch (closeErr) {
      console.error("⚠️ Failed to close MongoDB connection:", closeErr.message);
    }
  }
}

run();
