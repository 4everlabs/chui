import { action, mutation, query } from "./_generated/server";
import { makeFunctionReference } from "convex/server";
import { v } from "convex/values";
import { authComponent, createAuth } from "./betterAuth/auth";

const upsertProfileInternalRef = makeFunctionReference<
  "mutation",
  { username: string; authUserId?: string; email?: string },
  string
>("profiles_internal:upsertProfileInternal");

const USERNAME_RE = /^[a-z0-9]{3,20}$/;
const USERNAME_EMAIL_DOMAIN = "users.chui.local";

const normalizeUsername = (raw: string) => raw.trim().toLowerCase();

const requireValidUsername = (rawUsername: string) => {
  const username = normalizeUsername(rawUsername);
  if (!username || !USERNAME_RE.test(username)) {
    throw new Error("Username: 3-20 letters/numbers, case insensitive");
  }
  return username;
};

const usernameToEmail = (username: string) =>
  `${username}@${USERNAME_EMAIL_DOMAIN}`;

const getConvexJwtFromSessionToken = async (
  auth: ReturnType<typeof createAuth>,
  sessionToken: string | null | undefined,
) => {
  if (!sessionToken) {
    throw new Error("Authentication session token missing");
  }
  const { token } = await auth.api.getToken({
    headers: new Headers({
      Authorization: `Bearer ${sessionToken}`,
    }),
  });
  return token;
};

export const { getAuthUser } = authComponent.clientApi();

export const signUpWithUsernameEmailAndPassword = action({
  args: {
    username: v.string(),
    email: v.optional(v.string()),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const username = requireValidUsername(args.username);
    const requestedEmail = (args.email ?? "").trim().toLowerCase();
    const email = requestedEmail && requestedEmail.includes("@")
      ? requestedEmail
      : usernameToEmail(username);
    const auth = createAuth(ctx);

    const result = await auth.api.signUpEmail({
      body: {
        name: username,
        email,
        password: args.password,
      },
    });
    const convexToken = await getConvexJwtFromSessionToken(auth, result.token);

    const userId = await ctx.runMutation(upsertProfileInternalRef, {
      username,
      authUserId: result.user.id,
      email,
    });

    return {
      token: convexToken,
      username,
      userId,
    };
  },
});

export const signInWithEmailAndPassword = action({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    let email = args.email.trim().toLowerCase();
    if (!email) throw new Error("Email required");
    if (!email.includes("@")) {
      email = usernameToEmail(requireValidUsername(args.email));
    }
    const auth = createAuth(ctx);

    const result = await auth.api.signInEmail({
      body: {
        email,
        password: args.password,
        rememberMe: true,
      },
    });
    const convexToken = await getConvexJwtFromSessionToken(auth, result.token);

    const resolvedUsername = normalizeUsername(result.user.name ?? "");
    const userId = await ctx.runMutation(upsertProfileInternalRef, {
      username: resolvedUsername,
      authUserId: result.user.id,
    });

    return {
      token: convexToken,
      username: resolvedUsername,
      userId,
    };
  },
});

export const signOut = mutation({
  args: {},
  handler: async (ctx) => {
    const { auth, headers } = await authComponent.getAuth(createAuth, ctx);
    await auth.api.signOut({ headers });
    return { success: true };
  },
});

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const authUser = await authComponent.safeGetAuthUser(ctx);
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_auth_user_id", (q) =>
        q.eq("authUserId", identity.subject),
      )
      .unique();

    return {
      identity,
      authUser,
      profile,
    };
  },
});

export const listProfiles = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const profiles = await ctx.db.query("profiles").collect();
    return profiles.map((p) => ({
      username: p.username,
      email: p.email,
    }));
  },
});
