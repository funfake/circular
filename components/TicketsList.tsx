"use client";

import { useCallback } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
// Card UI is used within TicketCard, not directly here
import { SyncWithJiraButton } from "@/components/SyncWithJiraButton";
import { TicketCard } from "@/components/TicketCard";

type TicketsListProps = {
  projectId: Id<"projects">;
};

export function TicketsList({ projectId }: TicketsListProps) {
  const tickets = useQuery(api.tickets.listProjectTickets, { projectId });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Tickets</h2>
        <SyncWithJiraButton projectId={projectId} />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {tickets?.map((t) => (
          <TicketCard key={t._id} ticket={t} />
        ))}
        {tickets && tickets.length === 0 && (
          <div className="text-sm text-muted-foreground col-span-full">
            No tickets yet.
          </div>
        )}
      </div>
    </div>
  );
}
