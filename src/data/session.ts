import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

const sessionFilePath = join(homedir(), ".chui", "session-token");

const readPersistedToken = () => {
  try {
    const token = readFileSync(sessionFilePath, "utf8").trim();
    return token || null;
  } catch {
    return null;
  }
};

const persistToken = (token: string) => {
  try {
    mkdirSync(dirname(sessionFilePath), { recursive: true });
    writeFileSync(sessionFilePath, `${token}\n`, "utf8");
  } catch {
    // Ignore persistence failures; in-memory auth still works.
  }
};

const clearPersistedToken = () => {
  try {
    rmSync(sessionFilePath, { force: true });
  } catch {
    // Ignore cleanup failures.
  }
};

let authToken: string | null = readPersistedToken();

export const getAuthToken = () => authToken;

export const setAuthToken = (token: string) => {
  authToken = token;
  persistToken(token);
};

export const clearAuthToken = () => {
  authToken = null;
  clearPersistedToken();
};
