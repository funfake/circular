import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get task by ID
export const getTask = query({
  args: { taskId: v.id("developmentTasks") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.taskId);
  },
});

// Get all tasks for a user
export const getUserTasks = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("developmentTasks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

// Get tasks by ticket (works with both blackboxTickets and regular tickets)
export const getTicketTasks = query({
  args: { ticketId: v.id("blackboxTickets") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("developmentTasks")
      .withIndex("by_ticket", (q) => q.eq("ticketId", args.ticketId))
      .collect();
  },
});

// Get active tasks
export const getActiveTasks = query({
  handler: async (ctx) => {
    const tasks = await ctx.db
      .query("developmentTasks")
      .collect();
    
    return tasks.filter(task => 
      task.status !== "completed" && 
      task.status !== "failed"
    );
  },
});

// Update task status
export const updateTaskStatus = mutation({
  args: {
    taskId: v.id("developmentTasks"),
    status: v.union(
      v.literal("queued"),
      v.literal("analyzing"),
      v.literal("generating"),
      v.literal("committing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: any = {
      status: args.status,
    };

    if (args.errorMessage) {
      updates.errorMessage = args.errorMessage;
    }

    if (args.status === "completed" || args.status === "failed") {
      updates.completedAt = Date.now();
    }

    await ctx.db.patch(args.taskId, updates);
    return await ctx.db.get(args.taskId);
  },
});

// Update task with branch info
export const updateTaskBranch = mutation({
  args: {
    taskId: v.id("developmentTasks"),
    branchName: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.taskId, {
      branchName: args.branchName,
    });
    return await ctx.db.get(args.taskId);
  },
});

// Update task with commit info
export const updateTaskCommit = mutation({
  args: {
    taskId: v.id("developmentTasks"),
    commitSha: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.taskId, {
      commitSha: args.commitSha,
    });
    return await ctx.db.get(args.taskId);
  },
});

// Update task with PR info
export const updateTaskPullRequest = mutation({
  args: {
    taskId: v.id("developmentTasks"),
    pullRequestUrl: v.string(),
    pullRequestNumber: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.taskId, {
      pullRequestUrl: args.pullRequestUrl,
      pullRequestNumber: args.pullRequestNumber,
    });
    return await ctx.db.get(args.taskId);
  },
});

// Update task with BlackBox request ID
export const updateTaskBlackboxId = mutation({
  args: {
    taskId: v.id("developmentTasks"),
    blackboxRequestId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.taskId, {
      blackboxRequestId: args.blackboxRequestId,
    });
    return await ctx.db.get(args.taskId);
  },
});

// Retry failed task
export const retryFailedTask = mutation({
  args: {
    taskId: v.id("developmentTasks"),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    if (task.status !== "failed") {
      throw new Error("Task is not in failed status");
    }

    // Reset task to queued status
    await ctx.db.patch(args.taskId, {
      status: "queued",
      errorMessage: undefined,
      completedAt: undefined,
      startedAt: Date.now(),
    });

    return await ctx.db.get(args.taskId);
  },
});

// Get tasks by status
export const getTasksByStatus = query({
  args: {
    status: v.union(
      v.literal("queued"),
      v.literal("analyzing"),
      v.literal("generating"),
      v.literal("committing"),
      v.literal("completed"),
      v.literal("failed")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("developmentTasks")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();
  },
});
