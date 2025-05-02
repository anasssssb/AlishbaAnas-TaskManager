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
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Pinged MongoDB successfully. Connection is good!");
  } catch (err) {
    console.error("❌ MongoDB ping failed:", err);
  } finally {
    await client.close();
  }
}

run();