import { readUsers, writeUsers, type UserRecord } from "../../db/users.js";

type LoginResult = {
  userId: string;
  username: string;
};

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

const normalizeUsername = (raw: string): string => raw.trim().toLowerCase();

const getNextUserId = (users: UserRecord[]): number => {
  const maxId = users.reduce((max, user) => Math.max(max, user.userId), 0);
  return maxId + 1;
};

export const upsertByUsername = async (rawUsername: string): Promise<LoginResult> => {
  const username = normalizeUsername(rawUsername);

  if (!USERNAME_RE.test(username)) {
    throw new Error("Username must be 3-20 characters: [a-z0-9_]");
  }

  const users = await readUsers();
  const existing = users.find((user) => user.username === username);

  if (existing) {
    return { userId: String(existing.userId), username: existing.username };
  }

  const userId = getNextUserId(users);
  const nextUser = { userId, username };
  await writeUsers([...users, nextUser]);

  return { userId: String(userId), username };
};
