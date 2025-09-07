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
import GitHubRepoCombobox from "@/components/GitHubRepoCombobox";

const schema = z.object({
  repositoryId: z.string().optional(),
  jiraSourceUrl: z.string().optional(),
  githubPersonalAccessToken: z.string().optional(),
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
      jiraSourceUrl: "",
      githubPersonalAccessToken: "",
    },
  });

  // Update form when credentials are loaded
  useEffect(() => {
    if (credentials) {
      form.reset({
        repositoryId: credentials.repositoryId,
        jiraSourceUrl: credentials.jiraSourceUrl,
        githubPersonalAccessToken: credentials.githubPersonalAccessToken,
      });
    }
  }, [credentials, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      // Only send fields that are non-empty strings
      const partial: Partial<FormValues> = {};
      if (values.repositoryId) partial.repositoryId = values.repositoryId;
      if (values.jiraSourceUrl) partial.jiraSourceUrl = values.jiraSourceUrl;
      if (values.githubPersonalAccessToken)
        partial.githubPersonalAccessToken = values.githubPersonalAccessToken;

      await updateCredentials({ projectId, ...partial });
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
              name="jiraSourceUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jira Source URL</FormLabel>
                  <FormControl>
                    <Input placeholder="Your Jira source URL" {...field} />
                  </FormControl>
                  {/* <FormDescription>
                    URL to fetch Jira tickets from
                  </FormDescription> */}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="githubPersonalAccessToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GitHub Personal Access Token</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Your GitHub personal access token"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Personal access token for GitHub repository access. Create
                    one at{" "}
                    <a
                      className="underline"
                      target="_blank"
                      rel="noreferrer"
                      href="https://github.com/settings/personal-access-tokens"
                    >
                      GitHub personal access tokens
                    </a>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="repositoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Repository</FormLabel>
                  <FormControl>
                    <GitHubRepoCombobox
                      projectId={projectId}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      disabled={
                        !Boolean(credentials?.githubPersonalAccessToken)
                      }
                    />
                  </FormControl>
                  {/* <FormDescription>
                    GitHub repository identifier (owner/repo-name)
                  </FormDescription> */}
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
