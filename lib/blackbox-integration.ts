import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export interface TicketData {
  title: string;
  description: string;
  repositoryUrl: string;
  priority?: "low" | "medium" | "high" | "critical";
}

export interface RepoData {
  owner: string;
  name: string;
  defaultBranch?: string;
}

export interface User {
  _id: Id<"users">;
  email: string;
  name: string;
  githubUsername?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Repository {
  _id: Id<"repositories">;
  userId: Id<"users">;
  owner: string;
  name: string;
  fullName: string;
  defaultBranch: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Ticket {
  _id: Id<"tickets">;
  userId: Id<"users">;
  repositoryId: Id<"repositories">;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "pending" | "processing" | "completed" | "failed";
  assignedAt?: number;
  completedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface DevelopmentTask {
  _id: Id<"developmentTasks">;
  ticketId: Id<"tickets">;
  repositoryId: Id<"repositories">;
  userId: Id<"users">;
  status: "queued" | "analyzing" | "generating" | "committing" | "completed" | "failed";
  branchName?: string;
  commitSha?: string;
  pullRequestUrl?: string;
  pullRequestNumber?: number;
  errorMessage?: string;
  blackboxRequestId?: string;
  startedAt: number;
  completedAt?: number;
}

export class BlackBoxIntegration {
  private client: ConvexHttpClient;

  constructor(convexUrl?: string) {
    this.client = new ConvexHttpClient(
      convexUrl || process.env.NEXT_PUBLIC_CONVEX_URL!
    );
  }

  async processTicket(ticketData: TicketData, repoData: RepoData) {
    try {
      // Parse repository URL to get owner and name if provided
      let owner = repoData.owner;
      let name = repoData.name;
      
      if (ticketData.repositoryUrl) {
        const urlParts = ticketData.repositoryUrl.split('/');
        owner = urlParts[urlParts.length - 2];
        name = urlParts[urlParts.length - 1].replace('.git', '');
      }

      // Create user and repo if not exists
      const userRepo = await this.client.mutation(api.blackboxApi.createUserWithRepo, {
        userData: {
          email: "integration@circular.com",
          name: "Circular Integration",
          githubUsername: owner,
        },
        repositoryData: {
          owner,
          name,
          defaultBranch: repoData.defaultBranch,
        }
      });

      // Create and process ticket
      const result = await this.client.mutation(api.blackboxApi.createAndProcessTicket, {
        userId: userRepo.user._id,
        repositoryId: userRepo.repository._id,
        ticketData: {
          title: ticketData.title,
          description: ticketData.description,
          priority: ticketData.priority,
        },
        autoProcess: true
      });

      return result;
    } catch (error) {
      console.error("BlackBox AI processing failed:", error);
      throw error;
    }
  }

  async getTaskStatus(taskId: Id<"developmentTasks">) {
    try {
      return await this.client.query(api.tasks.getTask, { taskId });
    } catch (error) {
      console.error("Task status check failed:", error);
      throw error;
    }
  }

  async getUserDashboard(userId: Id<"users">) {
    try {
      return await this.client.query(api.blackboxApi.getUserDashboard, { userId });
    } catch (error) {
      console.error("Failed to get user dashboard:", error);
      throw error;
    }
  }

  async getRecentActivity(userId: Id<"users">) {
    try {
      return await this.client.query(api.blackboxApi.getRecentActivity, { userId });
    } catch (error) {
      console.error("Failed to get recent activity:", error);
      throw error;
    }
  }

  async retryFailedTasks(userId: Id<"users">) {
    try {
      return await this.client.mutation(api.blackboxApi.retryFailedTasks, { userId });
    } catch (error) {
      console.error("Failed to retry tasks:", error);
      throw error;
    }
  }

  async getSystemStats() {
    try {
      return await this.client.query(api.blackboxApi.getSystemStats, {});
    } catch (error) {
      console.error("Failed to get system stats:", error);
      throw error;
    }
  }
}

// Singleton instance for easy access
let blackboxInstance: BlackBoxIntegration | null = null;

export function getBlackBoxIntegration(): BlackBoxIntegration {
  if (!blackboxInstance) {
    blackboxInstance = new BlackBoxIntegration();
  }
  return blackboxInstance;
}

// Hook for React components
import { useQuery, useMutation } from "convex/react";

export function useBlackBoxIntegration() {
  const createUserWithRepo = useMutation(api.blackboxApi.createUserWithRepo);
  const createAndProcessTicket = useMutation(api.blackboxApi.createAndProcessTicket);
  const getUserDashboard = useQuery(api.blackboxApi.getUserDashboard);
  const getRecentActivity = useQuery(api.blackboxApi.getRecentActivity);
  const retryFailedTasks = useMutation(api.blackboxApi.retryFailedTasks);
  const getSystemStats = useQuery(api.blackboxApi.getSystemStats);

  return {
    createUserWithRepo,
    createAndProcessTicket,
    getUserDashboard,
    getRecentActivity,
    retryFailedTasks,
    getSystemStats,
  };
}
