"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { JobCard } from "@/components/JobCard";
import { Skeleton } from "@/components/ui/skeleton";

type JobsListProps = {
  ticketId: Id<"tickets">;
  onJobClick?: (jobId: Id<"jobs">) => void;
};

export function JobsList({ ticketId, onJobClick }: JobsListProps) {
  const jobs = useQuery(api.jobs.listTicketJobs, { ticketId });

  if (jobs === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-4 border rounded-lg bg-muted/50">
        No jobs created yet. Jobs will be automatically generated when the
        ticket is approved.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {jobs.map((job) => (
        <JobCard
          key={job._id}
          job={job}
          onClick={onJobClick ? () => onJobClick(job._id) : undefined}
        />
      ))}
    </div>
  );
}
