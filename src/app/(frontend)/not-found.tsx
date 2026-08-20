import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export default function NotFound() {
  return (
    <Container className="flex flex-1 flex-col items-center justify-center gap-5 py-28 text-center">
      <p className="font-display text-6xl font-extrabold text-accent">404</p>
      <h1 className="font-display text-2xl font-bold">Page not found</h1>
      <p className="max-w-md text-muted-foreground">
        Sorry, we couldn&apos;t find that page. It may have moved, or the vehicle may have been sold.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/vehicles">Browse stock</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Back home</Link>
        </Button>
      </div>
    </Container>
  );
}
