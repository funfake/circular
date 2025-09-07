"use client";

import { useParams, notFound } from "next/navigation";
import { Authenticated } from "convex/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Container } from "@/components/Container";
import { TicketsList } from "@/components/TicketsList";

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
  const project = useQuery(
    api.project.getProjectIfMember,
    projectId ? { projectId } : "skip"
  );

  if (!projectId) return null;
  if (project === undefined) return null;
  if (project === null) return notFound();

  return (
    <Container className="py-8">
      <h1 className="text-2xl font-semibold">{project.name}</h1>
      <div className="mt-6">
        <TicketsList projectId={projectId} />
      </div>
    </Container>
  );
}
