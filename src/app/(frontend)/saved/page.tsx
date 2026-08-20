import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { SavedList } from "@/components/vehicles/saved-list";

export const metadata: Metadata = {
  title: "Saved Vehicles",
  robots: { index: false, follow: true },
};

export default function SavedPage() {
  return (
    <>
      <PageHero eyebrow="Your shortlist" title="Saved vehicles" description="The cars you've saved to compare and revisit." />
      <Container className="py-12">
        <SavedList />
      </Container>
    </>
  );
}
