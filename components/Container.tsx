import * as React from "react";

import { cn } from "@/lib/utils";

type IntrinsicElement =
  | "div"
  | "main"
  | "section"
  | "article"
  | "aside"
  | "header"
  | "footer"
  | "nav";

type ContainerSize = "sm" | "md" | "lg" | "xl" | "2xl" | "full";

const sizeToMaxWidth: Record<ContainerSize, string> = {
  sm: "max-w-screen-sm",
  md: "max-w-screen-md",
  lg: "max-w-screen-lg",
  xl: "max-w-screen-xl",
  "2xl": "max-w-screen-2xl",
  full: "max-w-full",
};

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: IntrinsicElement;
  size?: ContainerSize;
  disableGutters?: boolean;
}

export function Container({
  as = "div",
  size = "lg",
  disableGutters = false,
  className,
  children,
  ...rest
}: ContainerProps) {
  const Component = as as React.ElementType;

  return (
    <Component
      data-slot="container"
      className={cn(
        "w-full mx-auto",
        sizeToMaxWidth[size],
        !disableGutters && "px-4 sm:px-6 lg:px-8",
        className
      )}
      {...rest}
    >
      {children}
    </Component>
  );
}

export default Container;
