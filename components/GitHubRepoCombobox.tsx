"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type RepoOption = { fullName: string; private: boolean };

export default function GitHubRepoCombobox({
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
  const [open, setOpen] = React.useState(false);
  const [options, setOptions] = React.useState<RepoOption[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const listRepos = useAction(api.credentials.listGithubRepos);

  const load = React.useCallback(async () => {
    if (disabled) return;
    setLoading(true);
    setError(null);
    try {
      const res = await listRepos({ projectId });
      const repos =
        (res as unknown as { repositories?: RepoOption[] }).repositories ?? [];
      setOptions(repos);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load repositories");
    } finally {
      setLoading(false);
    }
  }, [disabled, listRepos, projectId]);

  React.useEffect(() => {
    if (open && options.length === 0 && !loading) {
      void load();
    }
  }, [open, options.length, loading, load]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between"
        >
          {value || "Select repository..."}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder="Search repository..." className="h-9" />
          <CommandList>
            {error ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {error}
              </div>
            ) : (
              <>
                <CommandEmpty>
                  {loading ? "Loading..." : "No repositories found."}
                </CommandEmpty>
                <CommandGroup>
                  {options.map((repo) => (
                    <CommandItem
                      key={repo.fullName}
                      value={repo.fullName}
                      onSelect={(current) => {
                        onChange(current === value ? "" : current);
                        setOpen(false);
                      }}
                    >
                      {repo.fullName}
                      <Check
                        className={cn(
                          "ml-auto",
                          value === repo.fullName ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
