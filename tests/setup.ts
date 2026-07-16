process.env.NODE_ENV = "test"
process.env.JWT_SECRET = "test-jwt-secret-that-is-at-least-32-characters"
process.env.DISCORD_CLIENT_ID = "test-client-id"
process.env.DISCORD_CLIENT_SECRET = "test-client-secret"
process.env.DISCORD_REDIRECT_URI = "http://localhost:5000/api/auth/discord/callback"
process.env.ALLOWED_DISCORD_IDS = "123456789,987654321"
process.env.CLOUDINARY_CLOUD_NAME = "test-cloud"
process.env.CLOUDINARY_API_KEY = "test-api-key"
process.env.CLOUDINARY_API_SECRET = "test-api-secret"
process.env.CLIENT_URL = "http://localhost:5174"
process.env.ALLOWED_ORIGINS = "http://localhost:5173,http://localhost:5174"

import { randomUUID } from "node:crypto"
import mongoose from "mongoose"
import { afterAll, afterEach, beforeAll, inject } from "vitest"

beforeAll(async () => {
  // A database of this file's own on the shared instance, so parallel test
  // files cannot see or clear each other's writes.
  const uri = inject("mongoUri")
  process.env.MONGO_URI = uri
  await mongoose.connect(uri, { dbName: `test-${randomUUID()}` })
})

afterEach(async () => {
  const { collections } = mongoose.connection
  for (const key of Object.keys(collections)) {
    await collections[key]!.deleteMany({})
  }
})

afterAll(async () => {
  await mongoose.connection.dropDatabase()
  await mongoose.disconnect()
})
