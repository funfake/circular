"use client";

import { useParams, notFound } from "next/navigation";
import { Authenticated } from "convex/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Container } from "@/components/Container";

export default function ProjectPage() {
  return (
    <Authenticated>
      <Content />
    </Authenticated>
  );
}

function Content() {
  const params = useParams<{ id: string }>();
  const projectId = params?.id as string | undefined;
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
    </Container>
  );
}
