import { v } from "convex/values";
import { action, internalQuery, mutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";

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
        githubPersonalAccessToken: "",
      };
    }

    return {
      _id: credentials._id,
      projectId: credentials.projectId,
      repositoryId: credentials.repositoryId ?? "",
      jiraSourceUrl: credentials.jiraSourceUrl ?? "",
      githubPersonalAccessToken: credentials.githubPersonalAccessToken ?? "",
    };
  },
});

export const updateProjectCredentials = mutation({
  args: {
    projectId: v.id("projects"),
    repositoryId: v.optional(v.string()),
    jiraSourceUrl: v.optional(v.string()),
    githubPersonalAccessToken: v.optional(v.string()),
  },
  handler: async (
    ctx,
    { projectId, repositoryId, jiraSourceUrl, githubPersonalAccessToken }
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
    if (githubPersonalAccessToken !== undefined)
      fieldsToUpdate.githubPersonalAccessToken = githubPersonalAccessToken;

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

// Internal: read GitHub credentials for server-side actions
export const getGithubCredentialsInternal = internalQuery({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const creds = await ctx.db
      .query("credentials")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .unique();
    return {
      githubToken: creds?.githubPersonalAccessToken ?? "",
      repositoryId: creds?.repositoryId ?? "",
    } as const;
  },
});

// Action: list repositories accessible by the stored GitHub token
export const listGithubRepos = action({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    // Ensure current user is a member of the project
    const project = await ctx.runQuery(api.project.getProjectIfMember, {
      projectId,
    });
    if (project === null) throw new Error("Forbidden");

    // Load token
    const creds = await ctx.runQuery(
      internal.credentials.getGithubCredentialsInternal,
      { projectId }
    );
    const token = creds.githubToken.trim();
    if (!token) throw new Error("No GitHub token configured");

    const url =
      "https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member";
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "jira-to-code",
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `GitHub API error: ${res.status} ${res.statusText}${
          text ? ` - ${text.slice(0, 200)}` : ""
        }`
      );
    }

    const json = (await res.json()) as unknown;
    const repos = Array.isArray(json) ? json : [];
    const repositories = repos
      .map((r) => {
        if (typeof r !== "object" || r === null) return null;
        const o = r as Record<string, unknown>;
        const fullName = String(o["full_name"] ?? "");
        if (!fullName) return null;
        return { fullName, private: Boolean(o["private"] ?? false) };
      })
      .filter((x): x is { fullName: string; private: boolean } => x !== null);

    return { repositories } as const;
  },
});
