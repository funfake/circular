"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

const schema = z.object({
  title: z.string().min(2, "Title is too short"),
  tasks: z.string().min(10, "Tasks description is too short"),
});

type FormValues = z.infer<typeof schema>;

interface EditJobFormProps {
  job: Doc<"jobs">;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EditJobForm({ job, onSuccess, onCancel }: EditJobFormProps) {
  const updateJob = useMutation(api.jobs.updateJob);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: job.title,
      tasks: job.tasks,
    },
  });

  // Reset form when job changes
  useEffect(() => {
    form.reset({
      title: job.title,
      tasks: job.tasks,
    });
  }, [job, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      await updateJob({
        jobId: job._id,
        title: values.title,
        tasks: values.tasks,
      });
      toast.success("Job updated successfully");
      onSuccess?.();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to update job";
      toast.error(message);
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job Title</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter job title"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                A clear, concise title for this job
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tasks"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tasks & Acceptance Criteria</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter implementation tasks and acceptance criteria..."
                  className="min-h-[300px] resize-none"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                List the implementation steps and acceptance criteria. Use
                numbered lists for tasks and bullet points for criteria.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
