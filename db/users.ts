export type UserRecord = {
  userId: number;
  username: string;
};

const usersFileUrl = new URL("./users.csv", import.meta.url);

const parseUsersCsv = (contents: string): UserRecord[] => {
  const lines = contents
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return [];
  }

  const dataLines = lines.slice(1);

  return dataLines
    .map((line): [string, string] | null => {
      const [userIdRaw, usernameRaw] = line.split(",");
      if (!userIdRaw || !usernameRaw) {
        return null;
      }
      return [userIdRaw, usernameRaw];
    })
    .filter((tuple): tuple is [string, string] => tuple !== null)
    .map(([userIdRaw, username]) => ({
      userId: Number(userIdRaw),
      username,
    }))
    .filter((user) => Number.isFinite(user.userId) && user.username.length > 0);
};

const toCsvLine = (user: UserRecord): string =>
  `${user.userId},${user.username}`;

const ensureUsersFile = async (): Promise<void> => {
  const file = Bun.file(usersFileUrl);
  const exists = await file.exists();
  if (!exists) {
    await Bun.write(usersFileUrl, "user_id,username\n");
  }
};

export const readUsers = async (): Promise<UserRecord[]> => {
  await ensureUsersFile();
  const file = Bun.file(usersFileUrl);
  const contents = await file.text();
  return parseUsersCsv(contents);
};

export const writeUsers = async (users: UserRecord[]): Promise<void> => {
  await ensureUsersFile();
  const header = "user_id,username";
  const lines = [header, ...users.map(toCsvLine)];
  await Bun.write(usersFileUrl, `${lines.join("\n")}\n`);
};
