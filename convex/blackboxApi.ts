import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

// Note: This file provides BlackBox AI integration for the demo
// It works with the merged schema that includes both project management and BlackBox AI tables

// Create user and repository in one transaction (for BlackBox AI demo)
export const createUserWithRepo = mutation({
  args: {
    userData: v.object({
      email: v.string(),
      name: v.string(),
      githubUsername: v.optional(v.string()),
    }),
    repositoryData: v.object({
      owner: v.string(),
      name: v.string(),
      defaultBranch: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Create user in the users table (BlackBox AI schema)
    const userId = await ctx.db.insert("users", {
      email: args.userData.email,
      name: args.userData.name,
      githubUsername: args.userData.githubUsername,
      createdAt: now,
      updatedAt: now,
    });

    // Create repository in the repositories table (BlackBox AI schema)
    const repositoryId = await ctx.db.insert("repositories", {
      userId,
      owner: args.repositoryData.owner,
      name: args.repositoryData.name,
      fullName: `${args.repositoryData.owner}/${args.repositoryData.name}`,
      defaultBranch: args.repositoryData.defaultBranch || "main",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    const user = await ctx.db.get(userId);
    const repository = await ctx.db.get(repositoryId);

    return {
      user,
      repository,
    };
  },
});

// Create and process a BlackBox ticket (separate from project management tickets)
export const createAndProcessTicket = mutation({
  args: {
    userId: v.id("users"),
    repositoryId: v.id("repositories"),
    ticketData: v.object({
      title: v.string(),
      description: v.string(),
      priority: v.optional(v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
        v.literal("critical")
      )),
    }),
    autoProcess: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Create BlackBox ticket (using blackboxTickets table)
    const ticketId = await ctx.db.insert("blackboxTickets", {
      userId: args.userId,
      repositoryId: args.repositoryId,
      title: args.ticketData.title,
      description: args.ticketData.description,
      priority: args.ticketData.priority || "medium",
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    let task = null;
    if (args.autoProcess !== false) {
      // Create development task
      const taskId = await ctx.db.insert("developmentTasks", {
        ticketId,
        repositoryId: args.repositoryId,
        userId: args.userId,
        status: "queued",
        startedAt: now,
      });
      task = await ctx.db.get(taskId);
    }

    const ticket = await ctx.db.get(ticketId);

    return {
      ticket,
      task,
    };
  },
});

// Get user dashboard data for BlackBox AI
export const getUserDashboard = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get user data
    const user = await ctx.db.get(args.userId);
    
    // Get user's repositories
    const repositories = await ctx.db
      .query("repositories")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Get user's BlackBox tickets
    const tickets = await ctx.db
      .query("blackboxTickets")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Get user's development tasks
    const tasks = await ctx.db
      .query("developmentTasks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Group tickets by status
    const ticketsByStatus = {
      pending: tickets.filter(t => t.status === "pending").length,
      processing: tickets.filter(t => t.status === "processing").length,
      completed: tickets.filter(t => t.status === "completed").length,
      failed: tickets.filter(t => t.status === "failed").length,
    };

    // Group tasks by status
    const tasksByStatus = {
      queued: tasks.filter(t => t.status === "queued").length,
      analyzing: tasks.filter(t => t.status === "analyzing").length,
      generating: tasks.filter(t => t.status === "generating").length,
      committing: tasks.filter(t => t.status === "committing").length,
      completed: tasks.filter(t => t.status === "completed").length,
      failed: tasks.filter(t => t.status === "failed").length,
    };

    return {
      user,
      repositories,
      tickets,
      tasks,
      stats: {
        totalRepositories: repositories.length,
        activeRepositories: repositories.filter(r => r.isActive).length,
        totalTickets: tickets.length,
        totalTasks: tasks.length,
        ticketsByStatus,
        tasksByStatus,
      },
    };
  },
});

// Get recent activity for a user
export const getRecentActivity = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get recent tickets
    const tickets = await ctx.db
      .query("blackboxTickets")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(10);

    // Get recent tasks
    const tasks = await ctx.db
      .query("developmentTasks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(10);

    return {
      recentTickets: tickets,
      recentTasks: tasks,
    };
  },
});

// Retry failed tasks for a user
export const retryFailedTasks = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const failedTasks = await ctx.db
      .query("developmentTasks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "failed"))
      .collect();
    
    const results = [];
    for (const task of failedTasks) {
      try {
        await ctx.db.patch(task._id, {
          status: "queued",
          errorMessage: undefined,
        });
        results.push({ taskId: task._id, success: true });
      } catch (error) {
        results.push({ 
          taskId: task._id, 
          success: false, 
          error: error instanceof Error ? error.message : "Unknown error" 
        });
      }
    }

    return {
      retriedTasks: results.filter(r => r.success).length,
      failedRetries: results.filter(r => !r.success).length,
      results,
    };
  },
});

// Get system statistics
export const getSystemStats = query({
  args: {},
  handler: async (ctx) => {
    const pendingTickets = await ctx.db
      .query("blackboxTickets")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    const queuedTasks = await ctx.db
      .query("developmentTasks")
      .withIndex("by_status", (q) => q.eq("status", "queued"))
      .collect();

    const allTasks = await ctx.db
      .query("developmentTasks")
      .collect();

    const processingTasks = allTasks.filter(t => 
      t.status === "analyzing" || 
      t.status === "generating" || 
      t.status === "committing"
    );

    return {
      pendingTickets: pendingTickets.length,
      activeTasks: queuedTasks.length + processingTasks.length,
      queuedTasks: queuedTasks.length,
      processingTasks: processingTasks.length,
      timestamp: Date.now(),
    };
  },
});
