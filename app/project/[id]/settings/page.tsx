"use client";

import { Authenticated } from "convex/react";
import { useParams, notFound } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Container } from "@/components/Container";
import InviteMemberDialog from "@/components/InviteMemberDialog";
import MembersList from "@/components/MembersList";
import CredentialsForm from "@/components/CredentialsForm";

export default function ProjectSettingsPage() {
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
    projectId ? ({ projectId: projectId as Id<"projects"> } as const) : "skip"
  );

  if (!projectId) return null;
  if (project === undefined) return null;
  if (project === null) return notFound();

  return (
    <Container className="py-8">
      <h1 className="text-2xl font-semibold">Project Settings</h1>
      <p className="text-muted-foreground mt-2">{project.name}</p>
      <div className="mt-6 grid grid-cols-1 gap-6 max-w-screen-sm mx-auto">
        <InviteMemberDialog projectId={project._id} />
        <MembersList projectId={project._id} />
        <CredentialsForm projectId={project._id} />
      </div>
    </Container>
  );
}
