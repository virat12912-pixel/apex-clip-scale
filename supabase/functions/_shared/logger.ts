// Structured JSON logger for Edge Functions (audit H-35).
//
// Every operational event is one JSON line: { timestamp, level, function,
// message, ...fields }. Logs go to stdout, where the Supabase dashboard
// collects them. Never pass secrets, full user records, tokens, or raw
// request bodies in `fields` — ids and counts only.

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface Logger {
  debug(message: string, fields?: Record<string, unknown>): void;
  info(message: string, fields?: Record<string, unknown>): void;
  warn(message: string, fields?: Record<string, unknown>): void;
  error(message: string, fields?: Record<string, unknown>): void;
}

export function createLogger(functionName: string): Logger {
  const write = (level: LogLevel, message: string, fields: Record<string, unknown> = {}) => {
    // Keep the line JSON-safe: drop undefined values so the shape is stable.
    const entry: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      level,
      function: functionName,
      message,
    };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) entry[key] = value;
    }
    const line = JSON.stringify(entry);
    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else console.log(line);
  };

  return {
    debug: (message, fields) => write("debug", message, fields),
    info: (message, fields) => write("info", message, fields),
    warn: (message, fields) => write("warn", message, fields),
    error: (message, fields) => write("error", message, fields),
  };
}
