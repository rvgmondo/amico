import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { getT } from "@/lib/i18n-server";

export default async function NotFound() {
  const { t } = await getT();
  return (
    <Container className="flex flex-1 flex-col items-center justify-center gap-5 py-28 text-center">
      <p className="font-display text-6xl font-extrabold text-accent">404</p>
      <h1 className="font-display text-2xl font-bold">{t.errors.notFound}</h1>
      <p className="max-w-md text-muted-foreground">
        {t.errors.notFoundBody}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/vehicles">{t.common.browseStock}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">{t.common.backHome}</Link>
        </Button>
      </div>
    </Container>
  );
}
