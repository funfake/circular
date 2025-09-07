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
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

type TicketCardProps = {
  ticket: Doc<"tickets">;
};

export function TicketCard({ ticket }: TicketCardProps) {
  // Determine badge variant and text based on rejection status
  const getBadgeProps = () => {
    if (ticket.rejected === undefined) {
      return {
        variant: "secondary" as const,
        text: "Pending Review",
        className: "bg-gray-500 text-white border-gray-500 hover:bg-gray-600",
      };
    } else if (ticket.rejected === true) {
      return {
        variant: "destructive" as const,
        text: "Rejected",
        className: "",
      };
    } else {
      return {
        variant: "default" as const,
        text: "Approved",
        className:
          "bg-green-600 text-white border-green-600 hover:bg-green-700",
      };
    }
  };

  const badgeProps = getBadgeProps();

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <CardTitle className="text-base">
            #{ticket.jiraId} — {ticket.jiraTitle}
          </CardTitle>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge
            variant={badgeProps.variant}
            className={cn(badgeProps.className)}
          >
            {badgeProps.text}
          </Badge>
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
