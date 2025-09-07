"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { Container } from "@/components/Container";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PendingInvites from "@/components/PendingInvites";
import UserProjects from "@/components/UserProjects";
import CreateProjectDialog from "@/components/CreateProjectDialog";
import BlackBoxTestPanel from "@/components/BlackBoxTestPanel";

export default function Home() {
  return (
    <Container className="py-8">
      <h1 className="text-3xl font-bold mb-6">Circular - Jira to Code Platform</h1>
      
      {/* Authentication-specific content */}
      <Authenticated>
        <AuthenticatedContent />
      </Authenticated>
      
      <Unauthenticated>
        <div className="space-y-6">
          {/* Platform Features Section - Only visible to unauthenticated users */}
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
                      Automatically import tickets from Jira, analyze them, and split them into manageable development jobs.
                    </p>
                    <Button variant="outline" disabled>
                      Coming Soon
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">BlackBox AI Integration</CardTitle>
                    <CardDescription>
                      AI-powered code generation
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">
                      Use BlackBox AI to automatically generate code from development tickets and create pull requests.
                    </p>
                    <Link href="/blackbox-demo">
                      <Button>
                        Try Demo →
                      </Button>
                    </Link>
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

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Link href="/blackbox-demo">
                <Button>
                  BlackBox AI Demo
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Get Started with Circular</CardTitle>
              <CardDescription>
                Sign in to access project management and advanced features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Ready to streamline your development workflow? Sign in to create projects, manage tickets, and leverage AI-powered code generation.
              </p>
              <div className="flex gap-2">
                <Link href="/sign-up">
                  <Button>
                    Get Started →
                  </Button>
                </Link>
                <Link href="/sign-in">
                  <Button variant="outline">
                    Sign In
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </Unauthenticated>
    </Container>
  );
}

function AuthenticatedContent() {
  return (
    <div className="space-y-6">
      {/* Project Management Section - Only for authenticated users */}
      <Card>
        <CardHeader>
          <CardTitle>Your Projects</CardTitle>
          <CardDescription>
            Manage your projects and invitations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 max-w-md mx-auto">
            <CreateProjectDialog />
            <PendingInvites />
            <UserProjects />
          </div>
        </CardContent>
      </Card>

      {/* BlackBox AI Testing Section */}
      <BlackBoxTestPanel />
    </div>
  );
}
