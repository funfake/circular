"use client";

import { useState } from "react";
import { useParams, notFound } from "next/navigation";
import { Authenticated } from "convex/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Container } from "@/components/Container";
import { TicketCard } from "@/components/TicketCard";
import { JobsList } from "@/components/JobsList";
import { SyncWithJiraButton } from "@/components/SyncWithJiraButton";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ProjectPage() {
  return (
    <Authenticated>
      <Content />
    </Authenticated>
  );
}

function Content() {
  const params = useParams<{ id: string }>();
  const projectIdStr = params?.id as string | undefined;
  const projectId = projectIdStr as Id<"projects"> | undefined;
  const [selectedTicketId, setSelectedTicketId] =
    useState<Id<"tickets"> | null>(null);

  const project = useQuery(
    api.project.getProjectIfMember,
    projectId ? { projectId } : "skip"
  );

  const tickets = useQuery(
    api.tickets.listProjectTickets,
    projectId ? { projectId } : "skip"
  );

  if (!projectId) return null;
  if (project === undefined) return null;
  if (project === null) return notFound();

  return (
    <Container className="py-8" size="2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">{project.name}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column - Tickets */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Tickets</h2>
            <SyncWithJiraButton projectId={projectId} />
          </div>

          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="grid grid-cols-1 gap-4 pr-4">
              {tickets?.map((ticket) => (
                <TicketCard
                  key={ticket._id}
                  ticket={ticket}
                  onClick={() => setSelectedTicketId(ticket._id)}
                  isSelected={selectedTicketId === ticket._id}
                  onDeleted={() => {
                    // Clear selection if the deleted ticket was selected
                    if (selectedTicketId === ticket._id) {
                      setSelectedTicketId(null);
                    }
                  }}
                />
              ))}
              {tickets && tickets.length === 0 && (
                <div className="text-sm text-muted-foreground col-span-full">
                  No tickets yet. Click &quot;Sync with Jira&quot; to fetch
                  tickets.
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right Column - Jobs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Jobs</h2>
          </div>

          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="pr-4">
              {selectedTicketId &&
              tickets?.find((t) => t._id === selectedTicketId) ? (
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Jobs for ticket #
                    {tickets?.find((t) => t._id === selectedTicketId)?.jiraId}
                  </div>
                  <JobsList ticketId={selectedTicketId} />
                </div>
              ) : (
                <div className="text-sm text-muted-foreground p-4 border rounded-lg bg-muted/50">
                  Select a ticket to view its jobs
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </Container>
  );
}
