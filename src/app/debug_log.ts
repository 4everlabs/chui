import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const debugLogPath = process.env.CHUI_DEBUG_LOG_PATH?.trim() || join("logs", "chui.log");

type DebugLogContext = Record<string, unknown>;

const sensitiveKeyPattern = /password|secret|session|token/i;
let debugLogInitialized = false;

const toSerializable = (value: unknown): unknown => {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  return value;
};

const serializeContext = (context: DebugLogContext = {}): DebugLogContext => {
  const seen = new WeakSet<object>();
  const serialized = JSON.stringify(
    context,
    (key, value) => {
      if (key && sensitiveKeyPattern.test(key)) {
        return "[redacted]";
      }

      const serializable = toSerializable(value);
      if (serializable && typeof serializable === "object") {
        if (seen.has(serializable)) {
          return "[circular]";
        }
        seen.add(serializable);
      }

      return serializable;
    },
  );

  return JSON.parse(serialized ?? "{}") as DebugLogContext;
};

const prepareDebugLogFile = () => {
  mkdirSync(dirname(debugLogPath), { recursive: true });

  if (!debugLogInitialized) {
    writeFileSync(debugLogPath, "", "utf8");
    debugLogInitialized = true;
  }
};

export const debugLog = (event: string, context: DebugLogContext = {}) => {
  try {
    prepareDebugLogFile();
    appendFileSync(
      debugLogPath,
      `${JSON.stringify({
        time: new Date().toISOString(),
        event,
        context: serializeContext(context),
      })}\n`,
      "utf8",
    );
  } catch {
    // Logging must never interfere with the TUI.
  }
};
