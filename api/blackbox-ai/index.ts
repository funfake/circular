// BlackBox AI Integration Wrapper for Circular/Public
import { ConvexHttpClient } from "convex/browser";

export interface TicketData {
  title: string;
  description: string;
  repositoryUrl: string;
  priority?: "low" | "medium" | "high" | "critical";
}

export interface RepoData {
  owner: string;
  name: string;
  accessToken: string;
  defaultBranch?: string;
}

export class BlackBoxAIIntegration {
  private static client: ConvexHttpClient;

  static initialize(convexUrl: string) {
    this.client = new ConvexHttpClient(convexUrl);
  }

  static async processTicket(ticketData: TicketData, repoData: RepoData) {
    try {
      // Create user and repo if not exists
      const userRepo = await this.client.mutation("api:createUserWithRepo", {
        userData: {
          email: "integration@circular.com",
          name: "Circular Integration"
        },
        repositoryData: repoData
      });

      // Create and process ticket
      const ticket = await this.client.mutation("api:createAndProcessTicket", {
        userId: userRepo.user._id,
        repositoryId: userRepo.repository._id,
        ticketData,
        autoProcess: true
      });

      return ticket;
    } catch (error) {
      console.error("BlackBox AI processing failed:", error);
      throw error;
    }
  }

  static async createPullRequest(taskId: string, userId: string, options?: {
    title?: string;
    description?: string;
  }) {
    try {
      return await this.client.action("api:createTaskPullRequest", {
        taskId,
        userId,
        ...options
      });
    } catch (error) {
      console.error("PR creation failed:", error);
      throw error;
    }
  }

  static async getTaskStatus(taskId: string) {
    try {
      return await this.client.query("tasks:getTask", { taskId });
    } catch (error) {
      console.error("Task status check failed:", error);
      throw error;
    }
  }
}

// Export types
export * from './types/index';

// Export for direct access if needed
export { api } from './convex/_generated/api';
