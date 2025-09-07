import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Doc } from "./_generated/dataModel";

// Job splitting prompt framework
const JOB_SPLITTING_FRAMEWORK = `
You are a technical project manager breaking down a feature ticket into smaller, manageable development jobs.

SPLITTING PRINCIPLES:
1. Each job should be independently implementable
2. Jobs should be ordered by dependency (foundation first, then features)
3. Each job should be completable in 1-2 days by a single developer
4. Jobs should have clear, measurable completion criteria
5. Avoid overlapping responsibilities between jobs

JOB STRUCTURE:
Each job must have:
- A clear, concise title
- Detailed implementation tasks with specific steps
- Clear acceptance criteria
- Dependencies on other jobs (if any)

EXAMPLES OF GOOD JOB SPLITS:

For a "Dark Mode Toggle" feature:
1. Job: "Setup Theme Infrastructure"
   Tasks: Create theme context, Add theme provider, Setup CSS variables
2. Job: "Implement Toggle Component"
   Tasks: Create toggle UI, Add keyboard accessibility, Connect to theme context
3. Job: "Add Persistence Layer"
   Tasks: Implement localStorage, Handle SSR, Add migration logic

For an "API Authentication" feature:
1. Job: "Setup Auth Middleware"
   Tasks: Create middleware, Add JWT validation, Setup error handling
2. Job: "Implement Login Endpoint"
   Tasks: Create endpoint, Add validation, Generate tokens
3. Job: "Add Rate Limiting"
   Tasks: Setup rate limiter, Configure limits, Add bypass for admin

Now split this ticket into jobs:
`;

// Internal mutation to create jobs for a ticket
export const createJobsForTicket = internalMutation({
  args: {
    ticketId: v.id("tickets"),
    projectId: v.id("projects"),
    jobs: v.array(
      v.object({
        title: v.string(),
        tasks: v.string(),
      })
    ),
  },
  handler: async (ctx, { ticketId, projectId, jobs }) => {
    const createdJobs = [];

    for (const job of jobs) {
      const jobId = await ctx.db.insert("jobs", {
        ticketId,
        projectId,
        title: job.title,
        tasks: job.tasks,
        verifiedAt: undefined,
        prId: undefined,
        finishedAt: undefined,
      });
      createdJobs.push(jobId);
    }

    return { success: true, jobsCreated: createdJobs.length };
  },
});

// Internal query: list jobs for a ticket (for internal actions)
export const listJobsForTicketInternal = internalQuery({
  args: { ticketId: v.id("tickets") },
  handler: async (ctx, { ticketId }) => {
    return await ctx.db
      .query("jobs")
      .withIndex("by_ticket", (q) => q.eq("ticketId", ticketId))
      .collect();
  },
});

// Internal action: if all jobs for a ticket are complete, update Jira status to 41 (done)
export const updateJiraIfAllJobsComplete = internalAction({
  args: {
    ticketId: v.id("tickets"),
  },
  handler: async (
    ctx,
    { ticketId }
  ): Promise<
    { success: true } | { skipped: true; reason: string } | { error: string }
  > => {
    // Get ticket details
    const ticket = await ctx.runQuery(internal.assessment.getTicketById, {
      ticketId,
    });
    if (!ticket) {
      return { error: "Ticket not found" } as const;
    }

    // Load all jobs for this ticket
    const jobs = await ctx.runQuery(internal.jobs.listJobsForTicketInternal, {
      ticketId,
    });

    if (jobs.length === 0) {
      return { skipped: true, reason: "No jobs for ticket" } as const;
    }

    const allComplete = jobs.every(
      (j: Doc<"jobs">) => Boolean(j.finishedAt) && Boolean(j.prId)
    );
    if (!allComplete) {
      return { skipped: true, reason: "Jobs not all completed yet" } as const;
    }

    // Get Jira URL for this project
    const jiraUrl = await ctx.runQuery(
      internal.tickets.getJiraSourceUrlInternal,
      { projectId: ticket.projectId }
    );

    if (!jiraUrl) {
      return { skipped: true, reason: "No Jira URL configured" } as const;
    }

    try {
      const updateResponse = await fetch(jiraUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticketId: ticket.jiraId,
          ticketStatus: "41",
        }),
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error(
          `Failed to update Jira ticket status: ${updateResponse.status} ${updateResponse.statusText}`,
          errorText
        );
        return {
          error: `Jira update failed: ${updateResponse.status}`,
        } as const;
      }

      return { success: true } as const;
    } catch (error) {
      console.error("Error updating Jira ticket status:", error);
      return {
        error: error instanceof Error ? error.message : "Unknown error",
      } as const;
    }
  },
});

// Internal action to split a ticket into jobs
export const splitTicketIntoJobs = internalAction({
  args: {
    ticketId: v.id("tickets"),
    jiraTitle: v.string(),
    jiraDescription: v.string(),
    projectId: v.id("projects"),
  },
  handler: async (
    ctx,
    { ticketId, jiraTitle, jiraDescription, projectId }
  ): Promise<{ error?: string; success?: boolean; jobsCreated?: number }> => {
    // Get API key from environment
    const apiKey = process.env.BLACKBOX_API_KEY;
    if (!apiKey) {
      console.error("BLACKBOX_API_KEY not found in environment variables");
      return { error: "API key not configured" };
    }

    // Blackbox API endpoint
    const apiUrl = "https://api.blackbox.ai/chat/completions";

    // Prepare the prompt for job splitting
    const prompt = `${JOB_SPLITTING_FRAMEWORK}

Title: "${jiraTitle}"
Description: "${jiraDescription}"

IMPORTANT: Your response must be ONLY a valid JSON object with this exact structure:
{
  "jobs": [
    {
      "title": "Job title here",
      "tasks": "Detailed implementation steps:\n1. First task\n2. Second task\n3. Third task\n\nAcceptance Criteria:\n- Criterion 1\n- Criterion 2"
    },
    {
      "title": "Another job title",
      "tasks": "Detailed implementation steps:\n1. First task\n2. Second task\n\nAcceptance Criteria:\n- Criterion 1"
    }
  ]
}

Split this ticket into 2-5 jobs maximum. Each job should be specific and actionable.`;

    try {
      // Call BlackBox AI API
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "blackboxai/anthropic/claude-sonnet-4",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: 1500,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `BlackBox API error: ${response.status} ${response.statusText}`,
          errorText
        );
        return {
          error: `API request failed: ${response.status} - ${errorText}`,
        };
      }

      const data = await response.json();

      // Extract the response content
      let responseContent = "";
      if (
        data.choices &&
        Array.isArray(data.choices) &&
        data.choices.length > 0
      ) {
        const choice = data.choices[0];
        if (choice.message && choice.message.content) {
          responseContent = choice.message.content;
        } else if (choice.text) {
          responseContent = choice.text;
        }
      }

      if (!responseContent) {
        console.error("No content in API response");
        return { error: "No content found in API response" };
      }

      let jobsData;
      try {
        // Remove markdown code blocks if present
        let cleanedContent = responseContent;

        // Remove ```json and ``` markers
        cleanedContent = cleanedContent.replace(/```json\s*/g, "");
        cleanedContent = cleanedContent.replace(/```\s*/g, "");

        // Try to extract JSON from the response
        const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jobsData = JSON.parse(jsonMatch[0]);
        } else {
          jobsData = JSON.parse(cleanedContent);
        }
      } catch (parseError) {
        console.error(
          "Failed to parse AI response as JSON:",
          responseContent,
          parseError
        );
        return { error: "Failed to parse job splitting response" };
      }

      // Validate the response structure
      if (!jobsData.jobs || !Array.isArray(jobsData.jobs)) {
        console.error("Invalid response structure:", jobsData);
        return { error: "Invalid job splitting response structure" };
      }

      // Create jobs in the database
      const result = await ctx.runMutation(internal.jobs.createJobsForTicket, {
        ticketId,
        projectId,
        jobs: jobsData.jobs.map(
          (job: { title?: unknown; tasks?: unknown }) => ({
            title: String(job.title || "Untitled Job"),
            tasks: String(job.tasks || "No tasks specified"),
          })
        ),
      });

      // Set creatingJobs to false after successful job creation
      await ctx.runMutation(internal.assessment.updateTicketJobCreationStatus, {
        ticketId,
        creatingJobs: false,
      });

      return {
        success: true,
        jobsCreated: result.jobsCreated,
      };
    } catch (error) {
      console.error("Error splitting ticket into jobs:", error);
      // Set creatingJobs to false on error
      await ctx.runMutation(internal.assessment.updateTicketJobCreationStatus, {
        ticketId,
        creatingJobs: false,
      });
      return {
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

// Public query to list jobs for a ticket
export const listTicketJobs = query({
  args: { ticketId: v.id("tickets") },
  handler: async (ctx, { ticketId }): Promise<Array<Doc<"jobs">>> => {
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

    // Get all jobs for this ticket
    const jobs = await ctx.db
      .query("jobs")
      .withIndex("by_ticket", (q) => q.eq("ticketId", ticketId))
      .collect();

    return jobs;
  },
});

// Public mutation to update job status (for Push to Code functionality)
export const updateJobStatus = mutation({
  args: {
    jobId: v.id("jobs"),
    prId: v.string(),
    finishedAt: v.number(),
  },
  handler: async (ctx, { jobId, prId, finishedAt }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    // Get the job to verify project membership
    const job = await ctx.db.get(jobId);
    if (!job) throw new Error("Job not found");

    const userId = identity.subject;
    const membership = await ctx.db
      .query("members")
      .withIndex("by_project_member", (q) =>
        q.eq("projectId", job.projectId).eq("userId", userId)
      )
      .unique();
    if (!membership) throw new Error("Forbidden");

    // Update the job with PR ID and finished timestamp
    await ctx.db.patch(jobId, {
      prId,
      finishedAt,
    });

    // After finishing a job, check if all jobs for the ticket are complete and update Jira if so
    await ctx.scheduler.runAfter(0, internal.jobs.updateJiraIfAllJobsComplete, {
      ticketId: job.ticketId,
    });

    return { success: true };
  },
});

// Public query to list all jobs for a project
export const listProjectJobs = query({
  args: { projectId: v.id("projects") },
  handler: async (
    ctx,
    { projectId }
  ): Promise<Array<Doc<"jobs"> & { ticket?: Doc<"tickets"> }>> => {
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

    // Get all jobs for this project
    const jobs = await ctx.db
      .query("jobs")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();

    // Enrich with ticket data
    const enrichedJobs = await Promise.all(
      jobs.map(async (job) => {
        const ticket = await ctx.db.get(job.ticketId);
        return { ...job, ticket: ticket || undefined };
      })
    );

    return enrichedJobs;
  },
});

// Public mutation to update job details
export const updateJob = mutation({
  args: {
    jobId: v.id("jobs"),
    title: v.string(),
    tasks: v.string(),
  },
  handler: async (ctx, { jobId, title, tasks }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    // Get the job to verify project membership
    const job = await ctx.db.get(jobId);
    if (!job) throw new Error("Job not found");

    const userId = identity.subject;
    const membership = await ctx.db
      .query("members")
      .withIndex("by_project_member", (q) =>
        q.eq("projectId", job.projectId).eq("userId", userId)
      )
      .unique();
    if (!membership) throw new Error("Forbidden");

    // Update the job
    await ctx.db.patch(jobId, {
      title,
      tasks,
    });

    return { success: true };
  },
});

// Public query to get a single job
export const getJob = query({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, { jobId }): Promise<Doc<"jobs"> | null> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    // Get the job
    const job = await ctx.db.get(jobId);
    if (!job) return null;

    // Verify project membership
    const userId = identity.subject;
    const membership = await ctx.db
      .query("members")
      .withIndex("by_project_member", (q) =>
        q.eq("projectId", job.projectId).eq("userId", userId)
      )
      .unique();
    if (!membership) throw new Error("Forbidden");

    return job;
  },
});
