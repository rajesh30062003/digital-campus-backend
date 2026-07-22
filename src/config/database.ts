import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongod: MongoMemoryServer | null = null;

const connectDB = async (): Promise<void> => {
  let uri = process.env.MONGODB_URI;

  if (!uri) {
    console.log("⚠️  No MONGODB_URI found in environment. Starting MongoMemoryServer fallback...");
    try {
      mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();
      process.env.MONGODB_URI = uri;
      console.log(`🍃 In-Memory MongoDB started at: ${uri}`);
    } catch (e) {
      console.error("❌ Failed to start MongoMemoryServer:", e);
      process.exit(1);
    }
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

export { connectDB };
export default connectDB;
