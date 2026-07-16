import { createApp } from "./app.js"
import { connectDB, disconnectDB } from "./config/db.js"
import { env } from "./config/env.js"
import { logger } from "./utils/logger.js"

async function bootstrap(): Promise<void> {
  // Touch the secrets before binding a port: a misconfigured deploy should fail
  // at startup, not on the first admin write.
  void env.JWT_SECRET
  void env.ALLOWED_DISCORD_IDS

  await connectDB()

  const app = createApp()
  const server = app.listen(env.PORT, () => {
    logger.info(`[SERVER] Listening on http://localhost:${env.PORT}`)
    logger.info(`[SERVER] Environment: ${env.NODE_ENV}`)
  })

  const shutdown = (signal: string): void => {
    logger.info(`[SERVER] ${signal} received, shutting down`)

    server.close(() => {
      void disconnectDB().then(() => {
        logger.info("[SERVER] Closed cleanly")
        process.exit(0)
      })
    })

    // Never hang a deploy on a stuck connection.
    setTimeout(() => {
      logger.error("[SERVER] Forced shutdown after timeout")
      process.exit(1)
    }, 10_000).unref()
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"))
  process.on("SIGINT", () => shutdown("SIGINT"))
  process.on("unhandledRejection", (reason) => {
    logger.error("[PROCESS] Unhandled rejection:", reason)
  })
  process.on("uncaughtException", (error: Error) => {
    logger.error("[PROCESS] Uncaught exception:", error.message, error.stack)
    process.exit(1)
  })
}

bootstrap().catch((error: unknown) => {
  logger.error("[BOOTSTRAP] Fatal startup error:", error)
  process.exit(1)
})
