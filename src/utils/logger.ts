type LogLevel = "debug" | "info" | "warn" | "error"

const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: "\x1b[90m",
  info: "\x1b[36m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
}
const RESET = "\x1b[0m"

function format(level: LogLevel, message: string, ...args: unknown[]): string {
  const tag = level.toUpperCase().padEnd(5)
  const extra = args.length ? ` ${JSON.stringify(args)}` : ""
  return `${LEVEL_COLORS[level]}[${new Date().toISOString()}] ${tag}${RESET} ${message}${extra}`
}

const silent = (): boolean => process.env.NODE_ENV === "test"

export const logger = {
  debug(message: string, ...args: unknown[]): void {
    if (process.env.NODE_ENV !== "production" && !silent()) {
      console.debug(format("debug", message, ...args))
    }
  },
  info(message: string, ...args: unknown[]): void {
    if (!silent()) console.info(format("info", message, ...args))
  },
  warn(message: string, ...args: unknown[]): void {
    if (!silent()) console.warn(format("warn", message, ...args))
  },
  error(message: string, ...args: unknown[]): void {
    if (!silent()) console.error(format("error", message, ...args))
  },
}
