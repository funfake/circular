export interface User {
  _id: string;
  email: string;
  name: string;
  githubUsername?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Repository {
  _id: string;
  userId: string;
  owner: string;
  name: string;
  fullName: string;
  accessToken: string;
  defaultBranch: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Ticket {
  _id: string;
  userId: string;
  repositoryId: string;
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
  _id: string;
  ticketId: string;
  repositoryId: string;
  userId: string;
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

export interface FileChange {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

export interface ProcessingResult {
  ticket: Ticket;
  task: DevelopmentTask;
  success: boolean;
  error?: string;
}
