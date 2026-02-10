import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const USERNAME_RE = /^[a-z0-9]{3,20}$/;

const normalizeUsername = (raw: string) => raw.trim().toLowerCase();

const requireValidUsername = (rawUsername: string) => {
  const username = normalizeUsername(rawUsername);
  if (!USERNAME_RE.test(username)) {
    throw new Error("Username: 3-20 letters/numbers, case insensitive");
  }
  return username;
};

export const upsertByUsername = mutation({
  args: {
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const username = requireValidUsername(args.username);
    const now = Date.now();

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_username", (q) => q.eq("username", username))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { updatedAt: now });
      return {
        userId: String(existing._id),
        username: existing.username,
      };
    }

    const profileId = await ctx.db.insert("profiles", {
      username,
      createdAt: now,
      updatedAt: now,
    });

    return {
      userId: String(profileId),
      username,
    };
  },
});

export const getByUsername = query({
  args: {
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const username = requireValidUsername(args.username);
    return await ctx.db
      .query("profiles")
      .withIndex("by_username", (q) => q.eq("username", username))
      .unique();
  },
});

export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return await ctx.db
      .query("profiles")
      .withIndex("by_auth_user_id", (q) =>
        q.eq("authUserId", identity.subject),
      )
      .unique();
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
