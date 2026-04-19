import mongoose from "mongoose";

import { env } from "./env.js";

export const connectDatabase = async () => {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.MONGODB_URI);
};

export const disconnectDatabase = async () => {
  await mongoose.disconnect();
};
