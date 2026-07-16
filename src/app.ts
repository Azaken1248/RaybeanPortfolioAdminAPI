import cookieParser from "cookie-parser"
import cors from "cors"
import express, { type Application } from "express"
import helmet from "helmet"
import { env } from "./config/env.js"
import { errorHandler } from "./middleware/errorHandler.js"
import { publicLimiter } from "./middleware/rateLimit.js"
import { authRouter } from "./routes/auth.js"
import { commissionsRouter } from "./routes/commissions.js"
import { configRouter } from "./routes/config.js"
import { disciplinesRouter } from "./routes/disciplines.js"
import { portfolioRouter } from "./routes/portfolio.js"
import { uploadRouter } from "./routes/upload.js"
import { worksRouter } from "./routes/works.js"
import { NotFoundError } from "./utils/errors.js"

export function createApp(): Application {
  const app = express()

  // Required for correct client IPs (rate limiting) and secure cookies behind
  // a proxy such as Render or Fly.
  app.set("trust proxy", 1)
  app.disable("x-powered-by")

  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }))

  app.use(
    cors({
      // An explicit allowlist. A rejected origin gets no CORS headers, so the
      // browser blocks it; we do not throw, which would surface as a 500.
      origin: (origin, callback) => {
        callback(null, !origin || env.ALLOWED_ORIGINS.includes(origin))
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  )

  app.use(cookieParser())
  app.use(express.json({ limit: "1mb" }))
  app.use(express.urlencoded({ extended: true, limit: "1mb" }))

  app.get("/api/health", (_req, res) => {
    res.json({
      success: true,
      data: {
        status: "healthy",
        environment: env.NODE_ENV,
        timestamp: new Date().toISOString(),
      },
    })
  })

  app.use("/api/auth", authRouter)
  app.use("/api/portfolio", publicLimiter, portfolioRouter)
  app.use("/api/config", configRouter)
  app.use("/api/disciplines", disciplinesRouter)
  app.use("/api/works", worksRouter)
  app.use("/api/commissions", commissionsRouter)
  app.use("/api/upload", uploadRouter)

  app.use((req, _res, next) => {
    next(new NotFoundError(`Route ${req.method} ${req.originalUrl}`))
  })

  app.use(errorHandler)

  return app
}
