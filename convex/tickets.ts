import { v } from "convex/values";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { internal, api } from "./_generated/api";

type TicketFields = Pick<
  Doc<"tickets">,
  "jiraTitle" | "jiraDescription" | "jiraId"
>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseJiraTickets(raw: unknown): TicketFields[] {
  if (!Array.isArray(raw)) return [];
  const result: TicketFields[] = [];
  for (const item of raw) {
    if (!isRecord(item)) continue;
    const jiraId = String(item.jiraId ?? "");
    if (!jiraId) continue;
    const jiraTitle = String(item.jiraTitle ?? "");
    const jiraDescription = String(item.jiraDescription ?? "");
    result.push({ jiraId, jiraTitle, jiraDescription });
  }
  return result;
}

// Internal query: read Jira source URL for a project without auth checks (for cron/actions)
export const getJiraSourceUrlInternal = internalQuery({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const creds = await ctx.db
      .query("credentials")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .unique();
    return creds?.jiraSourceUrl ?? "";
  },
});

// Internal mutation: upsert tickets for a project
export const upsertTickets = internalMutation({
  args: {
    projectId: v.id("projects"),
    tickets: v.array(
      v.object({
        jiraTitle: v.string(),
        jiraDescription: v.string(),
        jiraId: v.string(),
      })
    ),
  },
  handler: async (
    ctx,
    { projectId, tickets }
  ): Promise<{ added: number; updated: number; total: number }> => {
    let added = 0;
    let updated = 0;

    for (const t of tickets) {
      const existing = await ctx.db
        .query("tickets")
        .withIndex("by_project_jiraId", (q) =>
          q.eq("projectId", projectId).eq("jiraId", t.jiraId)
        )
        .unique();

      if (!existing) {
        const ticketId = await ctx.db.insert("tickets", {
          projectId,
          jiraTitle: t.jiraTitle,
          jiraDescription: t.jiraDescription,
          jiraId: t.jiraId,
          rejected: undefined,
          rejectionReason: undefined,
        });
        added += 1;

        // Schedule assessment for this individual ticket
        await ctx.scheduler.runAfter(0, internal.assessment.assessTicket, {
          ticketId,
          jiraTitle: t.jiraTitle,
          jiraDescription: t.jiraDescription,
        });
        continue;
      }

      if (
        existing.jiraTitle !== t.jiraTitle ||
        existing.jiraDescription !== t.jiraDescription
      ) {
        await ctx.db.patch(existing._id, {
          jiraTitle: t.jiraTitle,
          jiraDescription: t.jiraDescription,
          rejected: undefined,
          rejectionReason: undefined,
        });
        updated += 1;

        // Schedule assessment for this individual ticket
        await ctx.scheduler.runAfter(0, internal.assessment.assessTicket, {
          ticketId: existing._id,
          jiraTitle: t.jiraTitle,
          jiraDescription: t.jiraDescription,
        });
      }
    }

    return { added, updated, total: tickets.length } as const;
  },
});

// Public query: list project tickets ordered by jiraId descending (latest first)
export const listProjectTickets = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }): Promise<Array<Doc<"tickets">>> => {
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

    // Scope by project via index, then sort by numeric jiraId desc for correctness
    const items = await ctx.db
      .query("tickets")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();

    return items.toSorted(
      (a, b) => Number(b.jiraId ?? 0) - Number(a.jiraId ?? 0)
    );
  },
});

// Public action: fetch from project's Jira source URL and upsert
export const refreshProjectTickets = action({
  args: { projectId: v.id("projects") },
  handler: async (
    ctx,
    { projectId }
  ): Promise<{ added: number; updated: number; total: number }> => {
    // Check if user is authenticated and is a member of the project
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const userId = identity.subject;
    const membership = await ctx.runQuery(
      internal.tickets.checkProjectMembership,
      {
        projectId,
        userId,
      }
    );
    if (!membership) {
      throw new Error("Forbidden");
    }

    const url = await ctx.runQuery(internal.tickets.getJiraSourceUrlInternal, {
      projectId,
    });
    if (!url) return { added: 0, updated: 0, total: 0 } as const;

    const response = await fetch(url, { method: "GET" });
    if (!response.ok) {
      throw new Error(
        `Failed to fetch tickets: ${response.status} ${response.statusText}`
      );
    }
    const raw = (await response.json()) as unknown;
    const parsed = parseJiraTickets(raw);

    const result = await ctx.runMutation(internal.tickets.upsertTickets, {
      projectId,
      tickets: parsed,
    });

    // Assessments are now scheduled automatically in upsertTickets

    return {
      added: result.added,
      updated: result.updated,
      total: result.total,
    };
  },
});

// Internal query to check project membership
export const checkProjectMembership = internalQuery({
  args: { projectId: v.id("projects"), userId: v.string() },
  handler: async (ctx, { projectId, userId }) => {
    const membership = await ctx.db
      .query("members")
      .withIndex("by_project_member", (q) =>
        q.eq("projectId", projectId).eq("userId", userId)
      )
      .unique();
    return !!membership;
  },
});

// Internal action used by cron: sync all projects daily
export const syncAllProjectsDaily = internalAction({
  args: {},
  handler: async (
    ctx
  ): Promise<{
    totalAdded: number;
    totalUpdated: number;
    totalSeen: number;
  }> => {
    // List all projects
    const projects = await ctx.runQuery(
      internal.tickets.listAllProjectsInternal,
      {}
    );

    let totalAdded = 0;
    let totalUpdated = 0;
    let totalSeen = 0;

    for (const p of projects) {
      const url = await ctx.runQuery(
        internal.tickets.getJiraSourceUrlInternal,
        {
          projectId: p._id as Id<"projects">,
        }
      );
      if (!url) continue;

      const response = await fetch(url, { method: "GET" });
      if (!response.ok) continue;
      const raw = (await response.json()) as unknown;
      const parsed = parseJiraTickets(raw);

      const res = await ctx.runMutation(internal.tickets.upsertTickets, {
        projectId: p._id as Id<"projects">,
        tickets: parsed,
      });

      // Assessments are now scheduled automatically in upsertTickets

      totalAdded += res.added;
      totalUpdated += res.updated;
      totalSeen += res.total;
    }

    return { totalAdded, totalUpdated, totalSeen } as const;
  },
});

// Internal query to list projects (for cron)
export const listAllProjectsInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    const projects = await ctx.db.query("projects").collect();
    return projects.map((p) => ({ _id: p._id }));
  },
});

// Public mutation to delete a ticket and its associated jobs
export const deleteTicket = mutation({
  args: { ticketId: v.id("tickets") },
  handler: async (ctx, { ticketId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    // Get the ticket to verify project membership
    const ticket = await ctx.db.get(ticketId);
    if (!ticket) throw new Error("Ticket not found");

    const userId = identity.subject;
    const membership = await ctx.db
      .query("members")
      .withIndex("by_project_member", (q) =>
        q.eq("projectId", ticket.projectId).eq("userId", userId)
      )
      .unique();
    if (!membership) throw new Error("Forbidden");

    // Delete all jobs associated with this ticket (using index)
    const jobs = await ctx.db
      .query("jobs")
      .withIndex("by_ticket", (q) => q.eq("ticketId", ticketId))
      .collect();

    for (const job of jobs) {
      await ctx.db.delete(job._id);
    }

    // Delete the ticket
    await ctx.db.delete(ticketId);

    return { success: true, jobsDeleted: jobs.length };
  },
});
