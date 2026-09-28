import { createHash } from "node:crypto";
import mongoose from "mongoose";
import type { Store, Options } from "express-rate-limit";

const schema = new mongoose.Schema({
  _id: { type: String, required: true },
  hits: { type: Number, required: true },
  resetAt: { type: Date, required: true, expires: 0 }
}, { versionKey: false });
const Counter = mongoose.model("AuthRateLimit", schema);

// Shared by all Lambda instances; expiration is checked atomically, independently
// of MongoDB's asynchronous TTL cleanup. Raw client addresses are not stored.
export class MongoRateLimitStore implements Store {
  localKeys = false;
  private windowMs = 900000;
  constructor(public prefix: string) {}
  init(options: Options) { this.windowMs = options.windowMs; }
  private id(key: string) {
    return `${this.prefix}:${createHash("sha256").update(key).digest("hex")}`;
  }
  async increment(key: string) {
    const expired = { $lte: [{ $ifNull: ["$resetAt", new Date(0)] }, "$$NOW"] };
    const update = [{ $set: {
      hits: { $cond: [expired, 1, { $add: ["$hits", 1] }] },
      resetAt: { $cond: [expired, { $add: ["$$NOW", this.windowMs] }, "$resetAt"] }
    } }];
    const run = () => Counter.findOneAndUpdate({ _id: this.id(key) }, update, { upsert: true, new: true }).lean();
    let counter;
    try { counter = await run(); } catch (error) {
      // Concurrent first requests can race the unique _id upsert.
      if ((error as { code?: number }).code !== 11000) throw error;
      counter = await run();
    }
    if (!counter) throw new Error("Rate limit store unavailable");
    return { totalHits: counter.hits, resetTime: counter.resetAt };
  }
  async decrement(key: string) {
    await Counter.updateOne({ _id: this.id(key), hits: { $gt: 0 } }, { $inc: { hits: -1 } });
  }
  async resetKey(key: string) { await Counter.deleteOne({ _id: this.id(key) }); }
}
