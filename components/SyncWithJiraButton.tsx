"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useCallback } from "react";
import { api } from "@/convex/_generated/api";
import { useAction } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

type SyncWithJiraButtonProps = {
  onClick?: () => void | Promise<void>;
  className?: string;
  disabled?: boolean;
  projectId: Id<"projects">;
};

export function SyncWithJiraButton({
  onClick,
  className,
  disabled,
  projectId,
}: SyncWithJiraButtonProps) {
  const refresh = useAction(api.tickets.refreshProjectTickets);

  const onRefresh = useCallback(async () => {
    try {
      // toast loading
      await toast.promise(refresh({ projectId }), {
        loading: "Syncing with Jira...",
        success: "Synced with Jira",
        error: "Failed to sync with Jira",
      });
      return;
    } catch (err) {
      console.error(err);
      toast.error("Failed to sync with Jira");
    }
  }, [refresh, projectId]);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onRefresh}
      className={className}
      disabled={disabled}
    >
      <span className="font-semibold">Sync with Jira</span>
      <Image
        src="/jira-logo.svg"
        alt="Jira"
        width={16}
        height={16}
        className="h-4 w-4"
      />
    </Button>
  );
}
