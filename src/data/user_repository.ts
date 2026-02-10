import { upsertByUsername as upsertByUsernameInConvex } from "./convex_actions.js";

type LoginResult = {
  userId: string;
  username: string;
};

const USERNAME_RE = /^[a-z0-9]{3,20}$/;

const normalizeUsername = (raw: string): string => raw.trim().toLowerCase();

export const upsertByUsername = async (rawUsername: string): Promise<LoginResult> => {
  const username = normalizeUsername(rawUsername);

  if (!USERNAME_RE.test(username)) {
    throw new Error("Username: 3-20 letters/numbers, case insensitive");
  }

  return await upsertByUsernameInConvex(username);
};
