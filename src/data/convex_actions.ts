type LoginResult = {
  userId: string;
  username: string;
};

export const upsertByUsername = async (username: string): Promise<LoginResult> => {
  void username;
  throw new Error("Convex not configured yet. Wire ConvexHttpClient to enable login.");
};
