"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { Container } from "@/components/Container";
import PendingInvites from "@/components/PendingInvites";
import UserProjects from "@/components/UserProjects";
import CreateProjectDialog from "@/components/CreateProjectDialog";

export default function Home() {
  return (
    <Container className="py-8">
      <Authenticated>
        <Content />
      </Authenticated>
      <Unauthenticated>
        <p className="text-muted-foreground">Please sign in to view data</p>
      </Unauthenticated>
    </Container>
  );
}

function Content() {
  return (
    <div className="mt-6 grid grid-cols-1 gap-6 max-w-md mx-auto">
      <CreateProjectDialog />
      <PendingInvites />
      <UserProjects />
    </div>
  );
}
