"use client";

import Link from "next/link";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { useT } from "@/components/i18n";
import { Container } from "@/components/ui/container";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useT();
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="flex flex-1 flex-col items-center justify-center gap-5 py-28 text-center">
      <p className="font-display text-5xl font-extrabold text-accent">{t.errors.oops}</p>
      <h1 className="font-display text-2xl font-bold">{t.errors.wrong}</h1>
      <p className="max-w-md text-muted-foreground">
        {t.errors.wrongBody}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>{t.errors.tryAgain}</Button>
        <Button asChild variant="outline">
          <Link href="/">{t.common.backHome}</Link>
        </Button>
      </div>
    </Container>
  );
}
