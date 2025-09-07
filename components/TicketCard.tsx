"use client";

import { Doc } from "@/convex/_generated/dataModel";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type TicketCardProps = {
  ticket: Doc<"tickets">;
  onClick?: () => void;
  isSelected?: boolean;
  onDeleted?: () => void;
};

export function TicketCard({
  ticket,
  onClick,
  isSelected,
  onDeleted,
}: TicketCardProps) {
  const deleteTicket = useMutation(api.tickets.deleteTicket);
  // Determine badge variant and text based on rejection status and job creation status
  const getBadgeProps = () => {
    // If jobs are being created, show loading state
    if (ticket.creatingJobs) {
      return {
        variant: "secondary" as const,
        text: "Creating Jobs",
        className: "bg-blue-500 text-white border-blue-500",
        isLoading: true,
      };
    }

    if (ticket.rejected === undefined) {
      return {
        variant: "secondary" as const,
        text: "Pending Review",
        className: "bg-gray-500 text-white border-gray-500 hover:bg-gray-600",
        isLoading: true, // Show loader since AI is working in the background
      };
    } else if (ticket.rejected === true) {
      return {
        variant: "destructive" as const,
        text: "Rejected",
        className: "",
        isLoading: false,
      };
    } else {
      return {
        variant: "default" as const,
        text: "Approved",
        className:
          "bg-green-600 text-white border-green-600 hover:bg-green-700",
        isLoading: false,
      };
    }
  };

  const badgeProps = getBadgeProps();

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    try {
      const result = await deleteTicket({ ticketId: ticket._id });
      toast.success(
        `Ticket deleted${result.jobsDeleted > 0 ? ` along with ${result.jobsDeleted} job(s)` : ""}`
      );
      onDeleted?.();
    } catch (error) {
      toast.error("Failed to delete ticket");
      console.error(error);
    }
  };

  return (
    <Card
      className={cn(
        "transition-all",
        onClick && "cursor-pointer hover:shadow-md hover:border-primary",
        isSelected && "border-primary shadow-md"
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <CardTitle className="text-base">
            #{ticket.jiraId} — {ticket.jiraTitle}
          </CardTitle>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge
            variant={badgeProps.variant}
            className={cn(badgeProps.className, "flex items-center gap-1")}
          >
            {badgeProps.isLoading && (
              <Loader2 className="h-3 w-3 animate-spin" />
            )}
            {badgeProps.text}
          </Badge>
          <AlertDialog>
            <AlertDialogTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Ticket</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete ticket #{ticket.jiraId}? This
                  will also delete all associated jobs. This action cannot be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-primary-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <CardAction />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {ticket.rejectionReason && (
          <div className="rounded-lg border p-3 bg-muted/50">
            <p className="text-sm font-medium mb-1">
              {ticket.rejected ? "Rejection Reason:" : "Assessment Note:"}
            </p>
            <p className="text-sm text-muted-foreground">
              {ticket.rejectionReason}
            </p>
          </div>
        )}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {ticket.jiraDescription}
          </ReactMarkdown>
        </div>
      </CardContent>
    </Card>
  );
}
