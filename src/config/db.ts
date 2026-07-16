import mongoose from "mongoose"
import { env } from "./env.js"
import { logger } from "../utils/logger.js"

export async function connectDB(): Promise<typeof mongoose> {
  const connection = await mongoose.connect(env.MONGO_URI, {
    serverSelectionTimeoutMS: 10_000,
  })

  logger.info(`[DB] MongoDB connected: ${connection.connection.host}`)

  mongoose.connection.on("error", (err) => {
    logger.error("[DB] Connection error:", err)
  })
  mongoose.connection.on("disconnected", () => {
    logger.warn("[DB] Disconnected. Driver will attempt to reconnect.")
  })

  return connection
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect()
  logger.info("[DB] Disconnected gracefully")
}
