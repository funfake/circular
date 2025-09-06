import * as React from "react";

import { cn } from "@/lib/utils";

interface HCardProps extends React.ComponentProps<"div"> {
  disableShadow?: boolean;
}

function HCard({ className, disableShadow = false, ...props }: HCardProps) {
  return (
    <div
      data-slot="h-card"
      className={cn(
        "bg-card text-card-foreground flex items-center justify-between rounded-xl border py-3 px-4 gap-4",
        !disableShadow && "shadow-sm",
        className
      )}
      {...props}
    />
  );
}

function HCardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="h-card-header"
      className={cn("min-w-0 flex-1", className)}
      {...props}
    />
  );
}

function HCardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="h-card-title"
      className={cn("leading-none font-medium truncate", className)}
      {...props}
    />
  );
}

function HCardDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="h-card-description"
      className={cn("text-muted-foreground text-sm truncate", className)}
      {...props}
    />
  );
}

function HCardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="h-card-content"
      className={cn("shrink-0", className)}
      {...props}
    />
  );
}

export { HCard, HCardHeader, HCardTitle, HCardDescription, HCardContent };
