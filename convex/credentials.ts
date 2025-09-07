import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
        jiraSourceUrl: "",
        githubToken: "",
      };
    }

    return {
      _id: credentials._id,
      projectId: credentials.projectId,
      repositoryId: credentials.repositoryId ?? "",
      jiraSourceUrl: credentials.jiraSourceUrl ?? "",
      githubToken: credentials.githubToken ?? "",
    };
  },
});

export const updateProjectCredentials = mutation({
  args: {
    projectId: v.id("projects"),
    repositoryId: v.optional(v.string()),
    jiraSourceUrl: v.optional(v.string()),
    githubToken: v.optional(v.string()),
  },
  handler: async (
    ctx,
    { projectId, repositoryId, jiraSourceUrl, githubToken }
  ) => {
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

    // Build a partial update with only provided fields
    const fieldsToUpdate: Record<string, string> = {};
    if (repositoryId !== undefined) fieldsToUpdate.repositoryId = repositoryId;
    if (jiraSourceUrl !== undefined)
      fieldsToUpdate.jiraSourceUrl = jiraSourceUrl;
    if (githubToken !== undefined) fieldsToUpdate.githubToken = githubToken;

    if (!existingCredentials) {
      // Create new credentials if they don't exist
      await ctx.db.insert("credentials", {
        projectId,
        ...fieldsToUpdate,
      });
    } else if (Object.keys(fieldsToUpdate).length > 0) {
      // Update existing credentials with only provided fields
      await ctx.db.patch(existingCredentials._id, fieldsToUpdate);
    }

    return { ok: true as const };
  },
});
