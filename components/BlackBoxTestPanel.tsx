"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBlackBoxIntegration } from "@/lib/blackbox-integration";
import { toast } from "sonner";
import { Loader2, Play, CheckCircle, XCircle, Clock } from "lucide-react";

export default function BlackBoxTestPanel() {
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<{
    success: boolean;
    message: string;
    timestamp: number;
    ticketId?: string;
    taskId?: string;
  } | null>(null);

  const {
    createUserWithRepo,
    createAndProcessTicket,
    getSystemStats,
  } = useBlackBoxIntegration();

  const systemStats = getSystemStats;

  // Predefined test data
  const testData = {
    title: "BlackBox API Test - Add Hello World Function",
    description: `Create a simple Hello World function that:
- Takes a name parameter (string)
- Returns a greeting message
- Includes proper TypeScript types
- Has basic error handling for empty names
- Includes a simple test case

This is a test ticket to verify BlackBox AI integration is working correctly.`,
    repoOwner: "blackboxai-test",
    repoName: "api-test-repo",
    priority: "medium" as const,
  };

  const runTest = async () => {
    setIsRunningTest(true);
    
    try {
      // Create user and repository for the test
      const userRepo = await createUserWithRepo({
        userData: {
          email: "test@blackboxai.com",
          name: "BlackBox Test User",
          githubUsername: testData.repoOwner,
        },
        repositoryData: {
          owner: testData.repoOwner,
          name: testData.repoName,
          defaultBranch: "main",
        },
      });

      if (!userRepo || !userRepo.user || !userRepo.repository) {
        throw new Error("Failed to create test user and repository");
      }

      // Create and process the test ticket
      const result = await createAndProcessTicket({
        userId: userRepo.user._id,
        repositoryId: userRepo.repository._id,
        ticketData: {
          title: testData.title,
          description: testData.description,
          priority: testData.priority,
        },
        autoProcess: true,
      });

      setLastTestResult({
        success: true,
        message: "Test ticket created and processing started successfully!",
        timestamp: Date.now(),
        ticketId: result.ticket?._id,
        taskId: result.task?._id,
      });

      toast.success("BlackBox API test completed successfully!");

    } catch (error) {
      console.error("BlackBox API test failed:", error);
      
      setLastTestResult({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: Date.now(),
      });

      toast.error("BlackBox API test failed. Check the console for details.");
    } finally {
      setIsRunningTest(false);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          BlackBox API Test
        </CardTitle>
        <CardDescription>
          Send a test ticket to verify BlackBox AI integration is working correctly
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* System Stats */}
        {systemStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-2 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-lg font-semibold">{systemStats.pendingTickets}</p>
            </div>
            <div className="text-center p-2 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Active</p>
              <p className="text-lg font-semibold">{systemStats.activeTasks}</p>
            </div>
            <div className="text-center p-2 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Queued</p>
              <p className="text-lg font-semibold">{systemStats.queuedTasks}</p>
            </div>
            <div className="text-center p-2 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Processing</p>
              <p className="text-lg font-semibold">{systemStats.processingTasks}</p>
            </div>
          </div>
        )}

        {/* Test Details */}
        <div className="space-y-2">
          <h4 className="font-medium">Test Ticket Details:</h4>
          <div className="text-sm space-y-1 p-3 bg-muted rounded-lg">
            <p><strong>Title:</strong> {testData.title}</p>
            <p><strong>Repository:</strong> {testData.repoOwner}/{testData.repoName}</p>
            <p><strong>Priority:</strong> <Badge variant="secondary">{testData.priority}</Badge></p>
            <details className="mt-2">
              <summary className="cursor-pointer font-medium">Description</summary>
              <p className="mt-2 text-xs whitespace-pre-line">{testData.description}</p>
            </details>
          </div>
        </div>

        {/* Test Button */}
        <Button 
          onClick={runTest} 
          disabled={isRunningTest}
          className="w-full"
          size="lg"
        >
          {isRunningTest ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Test...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Run BlackBox API Test
            </>
          )}
        </Button>

        {/* Last Test Result */}
        {lastTestResult && (
          <div className="space-y-2">
            <h4 className="font-medium">Last Test Result:</h4>
            <div className={`p-3 rounded-lg border ${
              lastTestResult.success 
                ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
            }`}>
              <div className="flex items-start gap-2">
                {lastTestResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                )}
                <div className="flex-1 space-y-1">
                  <p className={`text-sm font-medium ${
                    lastTestResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                  }`}>
                    {lastTestResult.success ? 'Success' : 'Failed'}
                  </p>
                  <p className={`text-xs ${
                    lastTestResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                  }`}>
                    {lastTestResult.message}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTimestamp(lastTestResult.timestamp)}
                    </span>
                    {lastTestResult.ticketId && (
                      <span>Ticket: {lastTestResult.ticketId.slice(-8)}</span>
                    )}
                    {lastTestResult.taskId && (
                      <span>Task: {lastTestResult.taskId.slice(-8)}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• This test creates a simple development ticket for BlackBox AI to process</p>
          <p>• The test uses predefined repository and ticket data</p>
          <p>• Check the system stats above to see the ticket enter the processing queue</p>
          <p>• For full testing capabilities, visit the <a href="/blackbox-demo" className="underline">BlackBox Demo</a></p>
        </div>
      </CardContent>
    </Card>
  );
}
