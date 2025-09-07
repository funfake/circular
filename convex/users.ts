import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new user
export const createUser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    githubUsername: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      return existingUser;
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      githubUsername: args.githubUsername,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return await ctx.db.get(userId);
  },
});

// Get user by ID
export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// Get user by email
export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

// Update user
export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    githubUsername: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;
    
    await ctx.db.patch(userId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(userId);
  },
});

// List all users
export const listUsers = query({
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});
