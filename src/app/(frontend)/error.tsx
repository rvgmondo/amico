"use client";

import Link from "next/link";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="flex flex-1 flex-col items-center justify-center gap-5 py-28 text-center">
      <p className="font-display text-5xl font-extrabold text-accent">Oops</p>
      <h1 className="font-display text-2xl font-bold">Something went wrong</h1>
      <p className="max-w-md text-muted-foreground">
        Sorry, an unexpected error occurred. Please try again, or contact us if it keeps happening.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button asChild variant="outline">
          <Link href="/">Back home</Link>
        </Button>
      </div>
    </Container>
  );
}
