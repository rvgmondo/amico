import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { SavedList } from "@/components/vehicles/saved-list";
import { getT } from "@/lib/i18n-server";

export const metadata: Metadata = {
  title: "Saved Vehicles",
  robots: { index: false, follow: true },
};

export default async function SavedPage() {
  const { t } = await getT();
  return (
    <>
      <PageHero eyebrow={t.saved.eyebrow} title={t.saved.title} description={t.saved.lead} />
      <Container className="py-12">
        <SavedList />
      </Container>
    </>
  );
}
