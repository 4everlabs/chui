import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { authComponent, createAuth } from "./betterAuth/auth";

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

type ProfileCtx = {
  db: {
    query: (...args: unknown[]) => any;
    patch: (...args: unknown[]) => Promise<unknown>;
    insert: (...args: unknown[]) => Promise<unknown>;
  };
};

const upsertProfile = async (
  ctx: ProfileCtx,
  username: string,
  authUserId: string | undefined,
  email?: string,
) => {
  const now = Date.now();
  const existing = await ctx.db
    .query("profiles")
    .withIndex("by_username", (q: any) => q.eq("username", username))
    .unique();

  if (existing) {
    await ctx.db.patch(existing._id, {
      updatedAt: now,
      authUserId: authUserId ?? existing.authUserId,
      ...(email !== undefined && { email }),
    });
    return;
  }

  await ctx.db.insert("profiles", {
    username,
    authUserId,
    email,
    createdAt: now,
    updatedAt: now,
  });
};

export const { getAuthUser } = authComponent.clientApi();

export const signUpWithUsernameEmailAndPassword = mutation({
  args: {
    username: v.string(),
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const username = requireValidUsername(args.username);
    const email = args.email.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      throw new Error("Valid email required for password reset");
    }
    const auth = createAuth(ctx);

    const result = await auth.api.signUpEmail({
      body: {
        name: username,
        email,
        password: args.password,
      },
    });

    await upsertProfile(ctx, username, result.user.id, email);

    return {
      token: result.token,
      username,
    };
  },
});

export const signInWithEmailAndPassword = mutation({
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

    const resolvedUsername = normalizeUsername(result.user.name ?? "");
    await upsertProfile(ctx, resolvedUsername, result.user.id);

    return {
      token: result.token,
      username: resolvedUsername,
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
