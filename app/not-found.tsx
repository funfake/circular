import Link from "next/link";
import { Container } from "@/components/Container";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Container as="main" className="py-20">
      <div className="text-center">
        <p className="text-sm font-medium text-muted-foreground">404</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Page not found
        </h1>
        <p className="mt-2 text-muted-foreground">
          Sorry, we couldn’t find the page you’re looking for.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button asChild>
            <Link href="/">Go back home</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Report an issue</Link>
          </Button>
        </div>
      </div>
    </Container>
  );
}
