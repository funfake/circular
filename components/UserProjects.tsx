"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function UserProjects() {
  const projects = useQuery(api.project.listUserProjects) ?? [];

  if (!projects.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Projects</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {projects.map((p) => (
          <Link
            key={p._id}
            href={`/project/${p._id}`}
            className="block rounded-md px-2 py-2 hover:bg-accent border"
          >
            <div className="font-medium">{p.name}</div>
            <div className="text-sm text-muted-foreground">{p.description}</div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
