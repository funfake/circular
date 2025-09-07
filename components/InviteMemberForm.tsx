"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const inviteSchema = z.object({ email: z.string().email("Invalid email") });
type InviteValues = z.infer<typeof inviteSchema>;

import type { Id } from "@/convex/_generated/dataModel";

export default function InviteMemberForm({
  projectId,
  onInvited,
}: {
  projectId: Id<"projects">;
  onInvited?: () => void;
}) {
  const invite = useMutation(api.project.inviteMemberByEmail);
  const form = useForm<InviteValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: InviteValues) => {
    try {
      await invite({ projectId: projectId as any, email: values.email });
      toast.success("Invitation sent");
      form.reset();
      onInvited?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to invite";
      toast.error(message);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="name@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Send invite</Button>
      </form>
    </Form>
  );
}
