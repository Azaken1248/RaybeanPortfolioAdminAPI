import { MongoMemoryServer } from "mongodb-memory-server"
import type { TestProject } from "vitest/node"

let mongo: MongoMemoryServer | undefined

/**
 * One in-memory MongoDB for the whole run, started once and shared.
 *
 * Starting one per test file raced on the shared binary lockfile the first time
 * the binary was downloaded, and paid the startup cost per file. Each file gets
 * its own database on this instance instead (see setup.ts), so they stay
 * isolated while running in parallel.
 */
export async function setup(project: TestProject): Promise<void> {
  mongo = await MongoMemoryServer.create()
  project.provide("mongoUri", mongo.getUri())
}

export async function teardown(): Promise<void> {
  await mongo?.stop()
}

declare module "vitest" {
  interface ProvidedContext {
    mongoUri: string
  }
}
