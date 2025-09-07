"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  HCard,
  HCardContent,
  HCardHeader,
  HCardTitle,
} from "@/components/ui/h-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import CreateProjectForm from "@/components/CreateProjectForm";

export default function CreateProjectDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <HCard>
        <HCardHeader>
          <HCardTitle>Create a project</HCardTitle>
        </HCardHeader>
        <HCardContent>
          <DialogTrigger asChild>
            <Button>Create</Button>
          </DialogTrigger>
        </HCardContent>
      </HCard>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
        </DialogHeader>
        <CreateProjectForm onCreated={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
