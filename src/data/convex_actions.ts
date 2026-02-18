import {
  clearConvexAuthToken,
  getConvexClient,
  setConvexAuthToken,
} from "./convex.js";
import { clearAuthToken, setAuthToken } from "./session.js";

const runMutation = async <TResult>(
  path: string,
  args: Record<string, unknown>,
): Promise<TResult> => {
  return await getConvexClient().mutation(path as any, args as any);
};

const runAction = async <TResult>(
  path: string,
  args: Record<string, unknown>,
): Promise<TResult> => {
  return await getConvexClient().action(path as any, args as any);
};

const runQuery = async <TResult>(
  path: string,
  args: Record<string, unknown>,
): Promise<TResult> => {
  return await getConvexClient().query(path as any, args as any);
};

export type AuthLoginResult = {
  token: string;
  username: string;
  userId: string;
};

export const signUpWithUsernameEmailAndPassword = async (
  username: string,
  password: string,
  email?: string,
): Promise<AuthLoginResult> => {
  const result = await runAction<AuthLoginResult>(
    "auth:signUpWithUsernameEmailAndPassword",
    { username, email, password },
  );

  setAuthToken(result.token);
  setConvexAuthToken(result.token);

  return result;
};

export const signInWithEmailAndPassword = async (
  email: string,
  password: string,
): Promise<AuthLoginResult> => {
  const result = await runAction<AuthLoginResult>(
    "auth:signInWithEmailAndPassword",
    { email, password },
  );

  setAuthToken(result.token);
  setConvexAuthToken(result.token);

  return result;
};

export const listProfiles = async (): Promise<{ username: string; email?: string }[]> => {
  return await runQuery("auth:listProfiles", {});
};

export type ConversationSummary = {
  conversationId: string;
  updatedAt: number;
  lastMessageAt?: number;
  lastMessagePreview?: string;
  otherUser: { userId: string; username: string } | null;
};

export type ConversationMessage = {
  _id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: number;
  senderUsername: string;
};

export const sendDirectMessage = async (
  toUsername: string,
  body: string,
): Promise<{ conversationId: string; messageId: string; createdAt: number }> => {
  return await runMutation("messages:sendDirectMessage", {
    toUsername,
    body,
  });
};

export const listMyConversations = async (
  limit?: number,
): Promise<ConversationSummary[]> => {
  return await runQuery("messages:listMyConversations", { limit });
};

export const listConversationMessages = async (
  conversationId: string,
  limit?: number,
): Promise<ConversationMessage[]> => {
  return await runQuery("messages:listConversationMessages", {
    conversationId,
    limit,
  });
};

export const signOut = async (): Promise<void> => {
  await runMutation("auth:signOut", {});
  clearAuthToken();
  clearConvexAuthToken();
};

export const getCurrentUser = async () => {
  return await runQuery<unknown>("auth:getCurrentUser", {});
};
