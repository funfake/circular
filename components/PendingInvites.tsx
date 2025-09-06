"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  HCard,
  HCardContent,
  HCardDescription,
  HCardHeader,
  HCardTitle,
} from "@/components/ui/h-card";
import { toast } from "sonner";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { useRouter } from "next/navigation";

export default function PendingInvites() {
  const auth = useAuth() as {
    user: { email?: string | null } | null | undefined;
    isLoading?: boolean;
  };
  const user = auth.user;
  const isLoading = auth.isLoading ?? typeof user === "undefined";
  const invites = useQuery(api.project.getPendingInvites);
  const join = useMutation(api.project.joinProjectFromInvite);
  const router = useRouter();

  if (isLoading) return null;
  if (!invites || !invites.length) return null;

  return (
    <div className="space-y-3">
      {invites.map((i) => (
        <HCard key={i.inviteId}>
          <HCardHeader>
            <HCardTitle>{i.name}</HCardTitle>
            <HCardDescription>{i.description}</HCardDescription>
          </HCardHeader>
          <HCardContent>
            <Button
              size="sm"
              onClick={async () => {
                try {
                  const res = await join({ inviteId: i.inviteId });
                  toast.success("Joined project");
                  if (res && typeof res === "object" && "projectId" in res) {
                    router.push(
                      `/project/${(res as { projectId: string }).projectId}`
                    );
                  }
                } catch (err: unknown) {
                  const message =
                    err instanceof Error ? err.message : "Failed to join";
                  toast.error(message);
                }
              }}
            >
              Join
            </Button>
          </HCardContent>
        </HCard>
      ))}
    </div>
  );
}
