import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Add a repository for a user
export const addRepository = mutation({
  args: {
    userId: v.id("users"),
    owner: v.string(),
    name: v.string(),
    defaultBranch: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if repository already exists for this user
    const existingRepo = await ctx.db
      .query("repositories")
      .withIndex("by_user_and_name", (q) => 
        q.eq("userId", args.userId)
         .eq("owner", args.owner)
         .eq("name", args.name)
      )
      .first();

    if (existingRepo) {
      // Update existing repository
      await ctx.db.patch(existingRepo._id, {
        defaultBranch: args.defaultBranch || existingRepo.defaultBranch,
        isActive: true,
        updatedAt: Date.now(),
      });
      return await ctx.db.get(existingRepo._id);
    }

    // Create new repository
    const repositoryId = await ctx.db.insert("repositories", {
      userId: args.userId,
      owner: args.owner,
      name: args.name,
      fullName: `${args.owner}/${args.name}`,
      defaultBranch: args.defaultBranch || "main",
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return await ctx.db.get(repositoryId);
  },
});

// Get repository by ID
export const getRepository = query({
  args: { repositoryId: v.id("repositories") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.repositoryId);
  },
});

// Get all repositories for a user
export const getUserRepositories = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("repositories")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Get active repositories
export const getActiveRepositories = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("repositories")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
  },
});

// Update repository
export const updateRepository = mutation({
  args: {
    repositoryId: v.id("repositories"),
    defaultBranch: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { repositoryId, ...updates } = args;
    
    await ctx.db.patch(repositoryId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(repositoryId);
  },
});

// Deactivate repository
export const deactivateRepository = mutation({
  args: { repositoryId: v.id("repositories") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.repositoryId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.repositoryId);
  },
});
