"use client";

import { Doc } from "@/convex/_generated/dataModel";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type TicketCardProps = {
  ticket: Doc<"tickets">;
};

export function TicketCard({ ticket }: TicketCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start">
        <CardTitle className="text-base">
          #{ticket.jiraId} — {ticket.jiraTitle}
        </CardTitle>
        <CardAction />
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {ticket.jiraDescription}
          </ReactMarkdown>
        </div>
      </CardContent>
    </Card>
  );
}
