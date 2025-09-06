import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

export const getPendingInvites = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const email =
      "email" in identity && typeof identity.email === "string"
        ? identity.email
        : undefined;
    if (!email) {
      // No email claim present, return empty securely
      return [];
    }

    const invites = await ctx.db
      .query("invitations")
      .withIndex("by_email_pending", (q) =>
        q.eq("email", email).eq("pending", true)
      )
      .collect();

    const flattened: Array<{
      inviteId: Id<"invitations">;
      projectId: Id<"projects">;
      name: string;
      description: string;
    }> = [];

    for (const invite of invites) {
      const project = await ctx.db.get(invite.projectId);
      if (!project) continue;
      flattened.push({
        inviteId: invite._id,
        projectId: project._id,
        name: project.name,
        description: project.description,
      });
    }

    return flattened;
  },
});

export const joinProjectFromInvite = mutation({
  args: { inviteId: v.id("invitations") },
  handler: async (ctx, { inviteId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const email =
      "email" in identity && typeof identity.email === "string"
        ? identity.email
        : undefined;
    if (!email) throw new Error("No email found on identity");

    const invite = await ctx.db.get(inviteId);
    if (!invite) throw new Error("Invite not found");
    if (!invite.pending) throw new Error("Invite already processed");
    if (invite.email.toLowerCase() !== email.toLowerCase()) {
      throw new Error("Invite email does not match current user");
    }

    const userId = identity.subject;
    const memberEmail =
      "email" in identity && typeof identity.email === "string"
        ? identity.email
        : undefined;
    // Create the membership
    await ctx.db.insert("members", {
      projectId: invite.projectId as Id<"projects">,
      userId,
      email: memberEmail,
    });

    // Mark invite as no longer pending
    await ctx.db.patch(inviteId, { pending: false });

    return { ok: true as const, projectId: invite.projectId };
  },
});

export const listUserProjects = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = identity.subject;

    console.log("userId", userId);

    const memberships = await ctx.db
      .query("members")
      .withIndex("by_member", (q) => q.eq("userId", userId))
      .collect();

    const projects = await Promise.all(
      memberships.map((m) => ctx.db.get(m.projectId))
    );

    const existing: Doc<"projects">[] = projects.filter(
      (p): p is Doc<"projects"> => p !== null
    );

    return existing.map((p) => ({
      _id: p._id,
      name: p.name,
      description: p.description,
    }));
  },
});

export const createProject = mutation({
  args: { name: v.string(), description: v.string() },
  handler: async (ctx, { name, description }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const ownerEmail =
      "email" in identity && typeof identity.email === "string"
        ? identity.email
        : undefined;

    const projectId = await ctx.db.insert("projects", {
      name,
      description,
      ownerId: identity.subject,
      ownerEmail,
    });

    await ctx.db.insert("members", {
      projectId,
      userId: identity.subject,
      email: ownerEmail,
    });

    // Create empty credentials for the project
    await ctx.db.insert("credentials", {
      projectId,
      repositoryId: "",
      jiraSourceUrl: "",
      githubToken: "",
    });

    return projectId;
  },
});

export const getProjectIfMember = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = identity.subject;

    const membership = await ctx.db
      .query("members")
      .withIndex("by_project_member", (q) =>
        q.eq("projectId", projectId).eq("userId", userId)
      )
      .unique();

    if (!membership) return null;

    const project = await ctx.db.get(projectId);
    if (!project) return null;
    return {
      _id: project._id,
      name: project.name,
      description: project.description,
    };
  },
});

export const listProjectMembers = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = identity.subject;

    const membership = await ctx.db
      .query("members")
      .withIndex("by_project_member", (q) =>
        q.eq("projectId", projectId).eq("userId", userId)
      )
      .unique();
    if (!membership) throw new Error("Forbidden");

    const project = await ctx.db.get(projectId);
    if (!project) throw new Error("Project not found");

    const members = await ctx.db
      .query("members")
      .withIndex("by_project_member", (q) => q.eq("projectId", projectId))
      .collect();

    return members.map((m) => ({
      _id: m._id,
      userId: m.userId,
      email: m.email,
      isOwner: !!m.userId && m.userId === project.ownerId,
      isCurrentUser: !!m.userId && m.userId === userId,
    }));
  },
});

export const inviteMemberByEmail = mutation({
  args: { projectId: v.id("projects"), email: v.string() },
  handler: async (ctx, { projectId, email }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = identity.subject;

    const normalizedEmail = email.trim().toLowerCase();

    // Ensure current user is a member of the project
    const membership = await ctx.db
      .query("members")
      .withIndex("by_project_member", (q) =>
        q.eq("projectId", projectId).eq("userId", userId)
      )
      .unique();
    if (!membership) throw new Error("Forbidden");

    // Do not invite if already a member (matched by email)
    const existingMembers = await ctx.db
      .query("members")
      .withIndex("by_project_member", (q) => q.eq("projectId", projectId))
      .collect();
    if (
      existingMembers.some(
        (m) => (m.email ?? "").toLowerCase() === normalizedEmail
      )
    ) {
      throw new Error("User is already a member");
    }

    // Avoid duplicate pending invites
    const pendingInvites = await ctx.db
      .query("invitations")
      .withIndex("by_email_pending", (q) =>
        q.eq("email", normalizedEmail).eq("pending", true)
      )
      .collect();
    const alreadyInvited = pendingInvites.some(
      (i) => i.projectId === projectId
    );
    if (alreadyInvited) return { ok: true as const };

    await ctx.db.insert("invitations", {
      projectId,
      email: normalizedEmail,
      pending: true,
    });

    return { ok: true as const };
  },
});

export const removeMember = mutation({
  args: { projectId: v.id("projects"), userId: v.string() },
  handler: async (ctx, { projectId, userId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const currentUserId = identity.subject;

    if (userId === currentUserId) {
      throw new Error("You cannot remove yourself from the project");
    }

    const project = await ctx.db.get(projectId);
    if (!project) throw new Error("Project not found");
    if (userId === project.ownerId) {
      throw new Error("You cannot remove the project owner");
    }

    // Ensure the remover is a member
    const removerMembership = await ctx.db
      .query("members")
      .withIndex("by_project_member", (q) =>
        q.eq("projectId", projectId).eq("userId", currentUserId)
      )
      .unique();
    if (!removerMembership) throw new Error("Forbidden");

    // Find membership of target user
    const targetMembership = await ctx.db
      .query("members")
      .withIndex("by_project_member", (q) =>
        q.eq("projectId", projectId).eq("userId", userId)
      )
      .unique();
    if (!targetMembership) return { ok: true as const };

    await ctx.db.delete(targetMembership._id);
    return { ok: true as const };
  },
});
