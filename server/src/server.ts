import { app } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import { startPushScheduler } from "./modules/gamification/push.scheduler.js";

const startServer = async () => {
  await connectDatabase();
  startPushScheduler();

  const server = app.listen(env.PORT, () => {
    console.log(`Server listening on http://localhost:${env.PORT}`);
  });

  const shutdown = async () => {
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => {
    void shutdown();
  });

  process.on("SIGTERM", () => {
    void shutdown();
  });
};

void startServer().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
