"use client";

import { useEffect, useState, useCallback } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

type RepoOption = { fullName: string; private: boolean };

export default function GitHubRepoSelector({
  projectId,
  value,
  onChange,
  disabled,
}: {
  projectId: Id<"projects">;
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const listRepos = useAction(api.credentials.listGithubRepos);
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<RepoOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listRepos({ projectId });
      const repos =
        (res as unknown as { repositories?: RepoOption[] }).repositories ??
        ([] as RepoOption[]);
      setOptions(repos);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load repositories");
    } finally {
      setLoading(false);
    }
  }, [listRepos, projectId]);

  useEffect(() => {
    if (!disabled && open && options.length === 0 && !loading) {
      void load();
    }
  }, [open, disabled, options.length, loading, load]);

  if (disabled) {
    return (
      <Select disabled value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Add a GitHub token to list repositories" />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select
      open={open}
      onOpenChange={setOpen}
      value={value ?? ""}
      onValueChange={onChange}
    >
      <SelectTrigger className="w-full">
        <SelectValue
          placeholder={
            loading ? "Loading repositories..." : "Select a repository"
          }
        />
      </SelectTrigger>
      <SelectContent>
        {error ? (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            {error}
          </div>
        ) : loading && options.length === 0 ? (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            Loading...
          </div>
        ) : options.length === 0 ? (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            No repositories found
          </div>
        ) : (
          options.map((r) => (
            <SelectItem key={r.fullName} value={r.fullName}>
              {r.fullName} {r.private ? "(private)" : ""}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
