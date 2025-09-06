"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { Container } from "@/components/Container";

export default function Home() {
  return (
    <Container className="py-8">
      <h1 className="text-2xl font-semibold">Convex + AuthKit</h1>
      <Authenticated>
        <Content />
      </Authenticated>
      <Unauthenticated>
        <p className="text-muted-foreground">Please sign in to view data</p>
      </Unauthenticated>
    </Container>
  );
}

function Content() {
  const data = "hello world";

  if (!data) return <p>Loading...</p>;

  return (
    <div className="mt-4">
      <p>{data}</p>
    </div>
  );
}
