"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { Container } from "@/components/Container";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import PendingInvites from "@/components/PendingInvites";
import UserProjects from "@/components/UserProjects";
import CreateProjectDialog from "@/components/CreateProjectDialog";

export default function Home() {
  return (
    <Container className="py-8">
      <Authenticated>
        <Content />
      </Authenticated>
      <Unauthenticated>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Welcome to Circular</CardTitle>
              <CardDescription>
                Please sign in to access the platform features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Circular integrates with Jira and uses BlackBox AI to
                automatically generate code from tickets.
              </p>
              <p className="text-sm text-muted-foreground">
                Sign in to get started →
              </p>
            </CardContent>
          </Card>
          {/* Platform Features Section */}
          <Card>
            <CardHeader>
              <CardTitle>Platform Features</CardTitle>
              <CardDescription>
                Explore the available features and integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Jira Integration</CardTitle>
                    <CardDescription>
                      Fetch and process tickets from Jira
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">
                      Automatically import tickets from Jira, analyze them, and
                      split them into manageable development jobs.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      BlackBox AI Integration
                    </CardTitle>
                    <CardDescription>
                      AI-powered code generation
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">
                      Use BlackBox AI to automatically generate code from
                      development tickets and create pull requests.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">How It Works</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Connect your Jira account or create tickets manually</li>
                  <li>Tickets are analyzed and validated for completeness</li>
                  <li>Valid tickets are split into development jobs</li>
                  <li>BlackBox AI generates code based on the requirements</li>
                  <li>Code is committed to a new branch in your repository</li>
                  <li>A pull request is created for review</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      </Unauthenticated>
    </Container>
  );
}

function Content() {
  return (
    <div className="space-y-6">
      {/* Project Management Section */}
      <div className="grid grid-cols-1 gap-6 max-w-md mx-auto">
        <CreateProjectDialog />
        <PendingInvites />
        <UserProjects />
      </div>
    </div>
  );
}
