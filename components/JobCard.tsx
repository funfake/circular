"use client";

import { Doc } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, GitPullRequest } from "lucide-react";
import { cn } from "@/lib/utils";
import { PushToCodeButton } from "@/components/PushToCodeButton";

type JobCardProps = {
  job: Doc<"jobs">;
  ticket?: Doc<"tickets">;
  onClick?: () => void;
};

export function JobCard({ job, ticket, onClick }: JobCardProps) {
  // Determine job status
  const getJobStatus = () => {
    if (job.finishedAt) {
      return {
        label: "Completed",
        icon: CheckCircle2,
        className: "bg-green-600 text-white",
      };
    }
    if (job.prId) {
      return {
        label: "In Progress",
        icon: GitPullRequest,
        className: "bg-blue-600 text-white",
      };
    }
    if (job.verifiedAt) {
      return {
        label: "Verified",
        icon: CheckCircle2,
        className: "bg-purple-600 text-white",
      };
    }
    return {
      label: "Generating",
      icon: Clock,
      className: "bg-gray-500 text-white",
    };
  };

  const status = getJobStatus();
  const StatusIcon = status.icon;

  // Format tasks for display
  const formatTasks = (tasks: string) => {
    const lines = tasks.split("\n").filter((line) => line.trim());
    const taskItems: string[] = [];
    const criteriaItems: string[] = [];
    let inCriteria = false;

    for (const line of lines) {
      if (line.includes("Acceptance Criteria:")) {
        inCriteria = true;
        continue;
      }
      if (inCriteria) {
        if (line.startsWith("-") || line.startsWith("•")) {
          criteriaItems.push(line.substring(1).trim());
        }
      } else {
        if (line.match(/^\d+\./)) {
          taskItems.push(line.substring(line.indexOf(".") + 1).trim());
        }
      }
    }

    return { taskItems, criteriaItems };
  };

  const { taskItems, criteriaItems } = formatTasks(job.tasks);

  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md gap-2",
        onClick && "cursor-pointer hover:border-primary"
      )}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base">{job.title}</CardTitle>
          <PushToCodeButton
            jobId={job._id}
            prId={job.prId}
            finishedAt={job.finishedAt}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {taskItems.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-1">Implementation Steps:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              {taskItems.map((task, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="mr-2">•</span>
                  <span className="flex-1">{task}</span>
                </li>
              ))}
              {/* {taskItems.length > 3 && (
                <li className="text-xs italic">
                  +{taskItems.length - 3} more tasks...
                </li>
              )} */}
            </ul>
          </div>
        )}

        {criteriaItems.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-1">Acceptance Criteria:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              {criteriaItems.map((criteria, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span className="flex-1">{criteria}</span>
                </li>
              ))}
              {/* {criteriaItems.length > 2 && (
                <li className="text-xs italic">
                  +{criteriaItems.length - 2} more criteria...
                </li>
              )} */}
            </ul>
          </div>
        )}

        {job.prId && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">PR: #{job.prId}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
