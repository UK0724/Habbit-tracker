import mongoose from "mongoose";

import { env } from "./env.js";

let connection: Promise<typeof mongoose> | undefined;

export const connectDatabase = async () => {
  if (mongoose.connection.readyState === 1) return;
  mongoose.set("strictQuery", true);
  connection ??= mongoose.connect(env.MONGODB_URI, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 10000
  }).catch((error: unknown) => {
    connection = undefined;
    throw error;
  });
  try {
    await connection;
  } finally {
    connection = undefined;
  }
};

export const disconnectDatabase = async () => {
  await mongoose.disconnect();
  connection = undefined;
};
