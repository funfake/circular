"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";
import { useEffect } from "react";

const schema = z.object({
  repositoryId: z.string().min(1, "Repository ID is required"),
  jiraToken: z.string().min(1, "Jira token is required"),
  githubToken: z.string().min(1, "GitHub token is required"),
});

type FormValues = z.infer<typeof schema>;

export default function CredentialsForm({
  projectId,
}: {
  projectId: Id<"projects">;
}) {
  const credentials = useQuery(api.credentials.getProjectCredentials, {
    projectId,
  });
  const updateCredentials = useMutation(
    api.credentials.updateProjectCredentials
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      repositoryId: "",
      jiraToken: "",
      githubToken: "",
    },
  });

  // Update form when credentials are loaded
  useEffect(() => {
    if (credentials) {
      form.reset({
        repositoryId: credentials.repositoryId,
        jiraToken: credentials.jiraToken,
        githubToken: credentials.githubToken,
      });
    }
  }, [credentials, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      await updateCredentials({
        projectId,
        ...values,
      });
      toast.success("Credentials updated successfully");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to update credentials";
      toast.error(message);
    }
  };

  if (credentials === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Credentials</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Credentials</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="repositoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Repository ID</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., owner/repository-name"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    GitHub repository identifier (owner/repo-name)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="jiraToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jira Token</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Your Jira API token"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    API token for accessing Jira tickets
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="githubToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GitHub Token</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Your GitHub personal access token"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Personal access token for GitHub repository access
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Update Credentials</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
