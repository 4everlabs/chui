import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  profiles: defineTable({
    username: v.string(),
    email: v.optional(v.string()),
    authUserId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_username", ["username"])
    .index("by_auth_user_id", ["authUserId"]),

  messages: defineTable({
    profileId: v.id("profiles"),
    body: v.string(),
    createdAt: v.number(),
  })
    .index("by_created_at", ["createdAt"])
    .index("by_profile_id_created_at", ["profileId", "createdAt"]),
});
