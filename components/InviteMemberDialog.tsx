"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  HCard,
  HCardContent,
  HCardHeader,
  HCardTitle,
} from "@/components/ui/h-card";
import { Button } from "@/components/ui/button";
import InviteMemberForm from "@/components/InviteMemberForm";
import type { Id } from "@/convex/_generated/dataModel";

export default function InviteMemberDialog({
  projectId,
}: {
  projectId: Id<"projects">;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <HCard>
        <HCardHeader>
          <HCardTitle>Invite a member</HCardTitle>
        </HCardHeader>
        <HCardContent>
          <DialogTrigger asChild>
            <Button>Invite</Button>
          </DialogTrigger>
        </HCardContent>
      </HCard>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite by email</DialogTitle>
        </DialogHeader>
        <InviteMemberForm
          projectId={projectId}
          onInvited={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
