import type { HomeChatMessage, HomeChatUser } from "./home";

export const filterUsersByQuery = (users: HomeChatUser[], query: string) => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return users;
  }
  return users.filter((user) => user.username.toLowerCase().includes(normalizedQuery));
};

export const sortMessagesByCreatedAt = (messages: HomeChatMessage[]) => {
  return [...messages].sort((a, b) => a.createdAt - b.createdAt);
};

export const toErrorMessage = (error: unknown) => {
  return error instanceof Error ? error.message : String(error);
};
