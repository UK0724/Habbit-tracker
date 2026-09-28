import serverless from "serverless-http";
import { app } from "./app.js";
import { connectDatabase } from "./config/database.js";

const proxy = serverless(app);

// Separate from server.ts: Lambda must not open a listener or start node-cron.
export const handler: typeof proxy = async (event, context) => {
  Object.assign(context, { callbackWaitsForEmptyEventLoop: false });
  try {
    await connectDatabase();
  } catch {
    // Never expose a database URI or credentials in a public error response.
    console.error("Database connection unavailable");
    return {
      statusCode: 503,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
      body: JSON.stringify({ message: "Service temporarily unavailable" })
    };
  }
  return proxy(event, context);
};
