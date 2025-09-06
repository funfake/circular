import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

// Create a new ticket
export const createTicket = mutation({
  args: {
    userId: v.id("users"),
    repositoryId: v.id("repositories"),
    title: v.string(),
    description: v.string(),
    priority: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    )),
  },
  handler: async (ctx, args) => {
    const ticketId = await ctx.db.insert("tickets", {
      userId: args.userId,
      repositoryId: args.repositoryId,
      title: args.title,
      description: args.description,
      priority: args.priority || "medium",
      status: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return await ctx.db.get(ticketId);
  },
});

// Get ticket by ID
export const getTicket = query({
  args: { ticketId: v.id("tickets") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.ticketId);
  },
});

// Get all tickets for a user
export const getUserTickets = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tickets")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

// Get tickets by repository
export const getRepositoryTickets = query({
  args: { repositoryId: v.id("repositories") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tickets")
      .withIndex("by_repository", (q) => q.eq("repositoryId", args.repositoryId))
      .order("desc")
      .collect();
  },
});

// Get tickets by status
export const getTicketsByStatus = query({
  args: {
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tickets")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();
  },
});

// Get pending tickets
export const getPendingTickets = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("tickets")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
  },
});

// Update ticket status
export const updateTicketStatus = mutation({
  args: {
    ticketId: v.id("tickets"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
  },
  handler: async (ctx, args) => {
    const updates: any = {
      status: args.status,
      updatedAt: Date.now(),
    };

    if (args.status === "processing") {
      updates.assignedAt = Date.now();
    } else if (args.status === "completed" || args.status === "failed") {
      updates.completedAt = Date.now();
    }

    await ctx.db.patch(args.ticketId, updates);
    return await ctx.db.get(args.ticketId);
  },
});

// Assign ticket for development
export const assignTicketForDevelopment = mutation({
  args: {
    ticketId: v.id("tickets"),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) {
      throw new Error("Ticket not found");
    }

    // Update ticket status to processing
    await ctx.db.patch(args.ticketId, {
      status: "processing",
      assignedAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create development task
    const taskId = await ctx.db.insert("developmentTasks", {
      ticketId: args.ticketId,
      repositoryId: ticket.repositoryId,
      userId: ticket.userId,
      status: "queued",
      startedAt: Date.now(),
    });

    return await ctx.db.get(taskId);
  },
});

// Update ticket priority
export const updateTicketPriority = mutation({
  args: {
    ticketId: v.id("tickets"),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.ticketId, {
      priority: args.priority,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.ticketId);
  },
});
