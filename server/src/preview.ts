// Disposable preview for browser tests. Never uses the developer or production database.
import { MongoMemoryServer } from "mongodb-memory-server";
const database = await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } });
process.env.NODE_ENV = "test";
process.env.MONGODB_URI = database.getUri();
process.env.JWT_SECRET = "isolated-browser-tests-not-for-production";
process.env.CLIENT_ORIGIN = "http://127.0.0.1:5175";
const { app } = await import("./app.js");
const { connectDatabase, disconnectDatabase } = await import("./config/database.js");
await connectDatabase();
const server = app.listen(4100, "127.0.0.1", () => console.log("Isolated browser API ready on 4100"));
const shutdown = () => server.close(() => { void disconnectDatabase().then(() => database.stop()).then(() => process.exit(0)); });
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
