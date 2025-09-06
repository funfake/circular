"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Authenticated, Unauthenticated } from "convex/react";
import { useAuth } from "@workos-inc/authkit-nextjs/components";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

type MinimalUser = {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
};

function Navbar() {
  const auth = useAuth() as {
    user: MinimalUser | null | undefined;
    signOut: () => void;
    isLoading?: boolean;
  };
  const { user, signOut } = auth;
  const isLoading = auth.isLoading ?? typeof user === "undefined";
  const pathname = usePathname();

  const firstName = user?.firstName ?? "User";
  const lastName = user?.lastName ?? "";
  const email = user?.email ?? "";
  const avatarText = (firstName?.[0] ?? "U").toUpperCase();
  const shouldShowAuthButtons = !isLoading && !user;
  const baseLinkClasses = "text-sm transition-colors";
  const inactiveClasses = "text-muted-foreground hover:text-primary";
  const activeClasses = "font-semibold";
  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname?.startsWith(href);
  const getLinkClass = (href: string, exact = false) =>
    `${baseLinkClasses} ${isActive(href, exact) ? activeClasses : inactiveClasses}`;
  // If we're on a project page, add a Settings link scoped to that project
  const projectMatch = pathname?.match(/^\/project\/([^/]+)/);
  const projectId = projectMatch?.[1];
  const mainLinks = projectId
    ? [{ href: `/project/${projectId}`, label: "Project Home", exact: true }]
    : [{ href: "/", label: "Home", exact: true }];
  const unauthLinks = [
    {
      href: "/sign-in",
      label: "Sign in",
      exact: true,
      variant: "default" as const,
    },
    {
      href: "/sign-up",
      label: "Sign up",
      exact: true,
      variant: "outline" as const,
    },
  ];

  return (
    <header>
      <div className="grid grid-cols-3 items-center h-14 px-4 sm:px-6 lg:px-8 max-w-screen-lg mx-auto w-full">
        {/* Left: Brand */}
        <div className="flex items-center">
          <Link href="/" className="font-semibold whitespace-nowrap">
            Circular.ai
          </Link>
        </div>

        {/* Center: Nav links */}
        <nav className="flex items-center justify-center gap-5">
          {mainLinks.map(({ href, label, exact }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href, !!exact) ? "page" : undefined}
              className={getLinkClass(href, !!exact)}
            >
              {label}
            </Link>
          ))}
          {projectId ? (
            <Link
              href={`/project/${projectId}/settings`}
              aria-current={
                isActive(`/project/${projectId}/settings`) ? "page" : undefined
              }
              className={getLinkClass(`/project/${projectId}/settings`)}
            >
              Settings
            </Link>
          ) : null}
        </nav>

        {/* Right: Auth */}
        <div className="flex items-center justify-end gap-4">
          <Authenticated>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full p-0"
                >
                  <Avatar>
                    <AvatarFallback title={firstName}>
                      {avatarText}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {firstName} {lastName}
                    </span>
                    {email ? (
                      <span className="text-xs text-muted-foreground">
                        {email}
                      </span>
                    ) : null}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Authenticated>

          {shouldShowAuthButtons ? (
            <Unauthenticated>
              <div className="flex items-center gap-2">
                {unauthLinks.map(({ href, label, exact, variant }) => (
                  <Button key={href} variant={variant} size="sm" asChild>
                    <Link
                      href={href}
                      aria-current={
                        isActive(href, !!exact) ? "page" : undefined
                      }
                    >
                      {label}
                    </Link>
                  </Button>
                ))}
              </div>
            </Unauthenticated>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
