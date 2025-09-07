"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Code2, CheckCircle2, Loader2 } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

type PushToCodeButtonProps = {
  jobId: Id<"jobs">;
  prId?: string;
  finishedAt?: number;
};

export function PushToCodeButton({
  jobId,
  prId,
  finishedAt,
}: PushToCodeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const updateJobStatus = useMutation(api.jobs.updateJobStatus);

  const handlePushToCode = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Prevent card click event

    // If already implemented, don't do anything
    if (prId && finishedAt) {
      return;
    }

    setIsLoading(true);

    try {
      // Mock 15 second loading delay
      await new Promise((resolve) => setTimeout(resolve, 15000));

      // Generate random PR ID (mock)
      const randomPrId = `PR-${Math.floor(Math.random() * 9000) + 1000}`;

      // Update job status in database
      await updateJobStatus({
        jobId,
        prId: randomPrId,
        finishedAt: Date.now(),
      });

      toast.success(`Job implemented successfully! PR: #${randomPrId}`);
    } catch (error) {
      console.error("Error updating job status:", error);
      toast.error("Failed to update job status");
    } finally {
      setIsLoading(false);
    }
  };

  // Determine button state
  const isImplemented = Boolean(prId && finishedAt);

  return (
    <Button
      size="sm"
      variant={isImplemented ? "secondary" : "default"}
      onClick={handlePushToCode}
      disabled={isLoading || isImplemented}
      className={
        isImplemented ? "bg-green-600 text-white hover:bg-green-600" : ""
      }
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : isImplemented ? (
        <>
          <CheckCircle2 className="h-4 w-4" />
          Implemented
        </>
      ) : (
        <>
          <Code2 className="h-4 w-4" />
          Push to Code
        </>
      )}
    </Button>
  );
}
