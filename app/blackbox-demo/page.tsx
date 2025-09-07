"use client";

import { useState } from "react";
import { Authenticated, Unauthenticated } from "convex/react";
import { Container } from "@/components/Container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBlackBoxIntegration } from "@/lib/blackbox-integration";
import { toast } from "sonner";

export default function BlackBoxDemo() {
  return (
    <Container className="py-8">
      <h1 className="text-3xl font-bold mb-6">BlackBox AI Integration Demo</h1>
      <Authenticated>
        <DemoContent />
      </Authenticated>
      <Unauthenticated>
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please sign in to use the BlackBox AI integration features
            </CardDescription>
          </CardHeader>
        </Card>
      </Unauthenticated>
    </Container>
  );
}

function DemoContent() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    repoOwner: "",
    repoName: "",
    priority: "medium" as "low" | "medium" | "high" | "critical",
  });

  const {
    createUserWithRepo,
    createAndProcessTicket,
    getSystemStats,
  } = useBlackBoxIntegration();

  const systemStats = getSystemStats;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.repoOwner || !formData.repoName) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsProcessing(true);

    try {
      // First create user and repository
      const userRepo = await createUserWithRepo({
        userData: {
          email: "demo@circular.com",
          name: "Demo User",
          githubUsername: formData.repoOwner,
        },
        repositoryData: {
          owner: formData.repoOwner,
          name: formData.repoName,
          defaultBranch: "main",
        },
      });

      if (!userRepo) {
        throw new Error("Failed to create user and repository");
      }

      // Then create and process the ticket
      const result = await createAndProcessTicket({
        userId: userRepo.user._id,
        repositoryId: userRepo.repository._id,
        ticketData: {
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
        },
        autoProcess: true,
      });

      toast.success("Ticket created and processing started!");
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        repoOwner: "",
        repoName: "",
        priority: "medium",
      });

    } catch (error) {
      console.error("Error processing ticket:", error);
      toast.error("Failed to process ticket. Please check the repository details.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* System Stats */}
      {systemStats && (
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Current BlackBox AI system statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Pending Tickets</p>
                <p className="text-2xl font-bold">{systemStats.pendingTickets}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Tasks</p>
                <p className="text-2xl font-bold">{systemStats.activeTasks}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Queued</p>
                <p className="text-2xl font-bold">{systemStats.queuedTasks}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Processing</p>
                <p className="text-2xl font-bold">{systemStats.processingTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Ticket Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create Development Ticket</CardTitle>
          <CardDescription>
            Submit a ticket for BlackBox AI to automatically generate code
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1">
                Ticket Title *
              </label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Add user authentication"
                disabled={isProcessing}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1">
                Description *
              </label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what needs to be implemented..."
                rows={4}
                disabled={isProcessing}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="repoOwner" className="block text-sm font-medium mb-1">
                  Repository Owner *
                </label>
                <Input
                  id="repoOwner"
                  value={formData.repoOwner}
                  onChange={(e) => setFormData({ ...formData, repoOwner: e.target.value })}
                  placeholder="e.g., octocat"
                  disabled={isProcessing}
                />
              </div>

              <div>
                <label htmlFor="repoName" className="block text-sm font-medium mb-1">
                  Repository Name *
                </label>
                <Input
                  id="repoName"
                  value={formData.repoName}
                  onChange={(e) => setFormData({ ...formData, repoName: e.target.value })}
                  placeholder="e.g., my-project"
                  disabled={isProcessing}
                />
              </div>
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium mb-1">
                Priority
              </label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-md"
                disabled={isProcessing}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <Button type="submit" disabled={isProcessing} className="w-full">
              {isProcessing ? "Processing..." : "Create & Process Ticket"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">1. Fill in the ticket details with your development request</p>
          <p className="text-sm">2. Specify the GitHub repository where code should be generated</p>
          <p className="text-sm">3. BlackBox AI will analyze the request and generate appropriate code</p>
          <p className="text-sm">4. The generated code will be committed to a new branch</p>
          <p className="text-sm">5. A pull request will be created for review</p>
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              ⚠️ Note: Ensure the BlackBox AI bot has access to your repository
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
