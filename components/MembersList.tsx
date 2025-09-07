"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  HCard,
  HCardContent,
  HCardHeader,
  HCardTitle,
  HCardDescription,
} from "@/components/ui/h-card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import type { Id } from "@/convex/_generated/dataModel";

export default function MembersList({
  projectId,
}: {
  projectId: Id<"projects">;
}) {
  const members = useQuery(api.project.listProjectMembers, { projectId }) ?? [];
  const removeMember = useMutation(api.project.removeMember);

  if (!members.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Members</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {members.map((m) => (
          <HCard key={m._id} disableShadow>
            <HCardHeader>
              <HCardTitle>{m.email ?? m.userId ?? "Unknown"}</HCardTitle>
              <HCardDescription>
                {m.isOwner ? "Owner" : "Member"}
              </HCardDescription>
            </HCardHeader>
            <HCardContent>
              <Button
                size="sm"
                variant="outline"
                className="disabled:cursor-not-allowed disabled:pointer-events-auto"
                disabled={m.isCurrentUser || m.isOwner || !m.userId}
                onClick={async () => {
                  try {
                    if (!m.userId) return;
                    await removeMember({
                      projectId: projectId,
                      userId: m.userId,
                    });
                    toast.success("Member removed");
                  } catch (err: unknown) {
                    const message =
                      err instanceof Error ? err.message : "Failed to remove";
                    toast.error(message);
                  }
                }}
              >
                Remove
              </Button>
            </HCardContent>
          </HCard>
        ))}
      </CardContent>
    </Card>
  );
}
