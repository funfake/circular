import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const getProjectCredentials = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = identity.subject;

    // Ensure current user is a member of the project
    const membership = await ctx.db
      .query("members")
      .withIndex("by_project_member", (q) =>
        q.eq("projectId", projectId).eq("userId", userId)
      )
      .unique();
    if (!membership) throw new Error("Forbidden");

    // Get credentials for the project
    const credentials = await ctx.db
      .query("credentials")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .unique();

    if (!credentials) {
      // Return empty credentials if none exist
      return {
        _id: null,
        projectId,
        repositoryId: "",
        jiraToken: "",
        githubToken: "",
      };
    }

    return {
      _id: credentials._id,
      projectId: credentials.projectId,
      repositoryId: credentials.repositoryId,
      jiraToken: credentials.jiraToken,
      githubToken: credentials.githubToken,
    };
  },
});

export const updateProjectCredentials = mutation({
  args: {
    projectId: v.id("projects"),
    repositoryId: v.string(),
    jiraToken: v.string(),
    githubToken: v.string(),
  },
  handler: async (ctx, { projectId, repositoryId, jiraToken, githubToken }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = identity.subject;

    // Ensure current user is a member of the project
    const membership = await ctx.db
      .query("members")
      .withIndex("by_project_member", (q) =>
        q.eq("projectId", projectId).eq("userId", userId)
      )
      .unique();
    if (!membership) throw new Error("Forbidden");

    // Get existing credentials
    const existingCredentials = await ctx.db
      .query("credentials")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .unique();

    if (!existingCredentials) {
      // Create new credentials if they don't exist
      await ctx.db.insert("credentials", {
        projectId,
        repositoryId,
        jiraToken,
        githubToken,
      });
    } else {
      // Update existing credentials
      await ctx.db.patch(existingCredentials._id, {
        repositoryId,
        jiraToken,
        githubToken,
      });
    }

    return { ok: true as const };
  },
});
