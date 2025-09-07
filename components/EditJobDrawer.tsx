"use client";

import { useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { EditJobForm } from "@/components/EditJobForm";
import { Doc } from "@/convex/_generated/dataModel";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EditJobDrawerProps {
  job: Doc<"jobs">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditJobDrawer({ job, open, onOpenChange }: EditJobDrawerProps) {
  const handleSuccess = () => {
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="h-full w-full sm:max-w-lg">
        <DrawerHeader className="border-b">
          <DrawerTitle>Edit Job</DrawerTitle>
          <DrawerDescription>
            Update the job details including title and tasks
          </DrawerDescription>
        </DrawerHeader>

        <ScrollArea className="flex-1 p-6">
          <EditJobForm
            job={job}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}
