import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { RichText } from "@/components/rich-text";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { SectionHeading } from "@/components/ui/section-heading";
import { Stars } from "@/components/ui/stars";
import { getPageBySlug, getTeam, getTestimonials, mediaUrl } from "@/lib/payload";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  if (!page) return { title: "Page not found" };
  return {
    title: page.title,
    description: page.hero?.subheading ?? undefined,
    alternates: { canonical: `/${slug}` },
  };
}

export default async function CmsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  if (!page) notFound();

  return (
    <>
      <PageHero
        eyebrow={slug === "about" ? "About us" : undefined}
        title={page.hero?.heading || page.title}
        description={page.hero?.subheading || undefined}
      />
      {page.content ? (
        <Container className="py-12">
          <div className="max-w-3xl">
            <RichText data={page.content as never} />
          </div>
        </Container>
      ) : null}

      {slug === "about" ? <AboutExtras /> : null}
    </>
  );
}

async function AboutExtras() {
  const [team, testimonials] = await Promise.all([getTeam(), getTestimonials(6)]);

  return (
    <>
      {team.length ? (
        <section className="bg-subtle py-14">
          <Container className="flex flex-col gap-8">
            <SectionHeading eyebrow="Our team" title="The people who'll help you" />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {team.map((m) => {
                const photo = typeof m.photo === "object" ? m.photo : null;
                const src = mediaUrl(photo, "card");
                return (
                  <div key={m.id} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                      {src ? (
                        <Image src={src} alt={photo?.alt || m.name} fill sizes="360px" className="object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                          Photo coming soon
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-display font-bold">{m.name}</h3>
                      {m.role ? <p className="text-sm text-accent">{m.role}</p> : null}
                    </div>
                    {m.bio ? <p className="text-sm text-muted-foreground">{m.bio}</p> : null}
                  </div>
                );
              })}
            </div>
          </Container>
        </section>
      ) : null}

      {testimonials.length ? (
        <section className="py-14">
          <Container className="flex flex-col gap-8">
            <SectionHeading eyebrow="What people say" title="In our customers' words" />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((t) => (
                <figure key={t.id} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6">
                  <Stars rating={t.rating} />
                  <blockquote className="flex-1 text-sm leading-relaxed">{t.quote}</blockquote>
                  <figcaption className="text-sm font-bold">{t.author}</figcaption>
                </figure>
              ))}
            </div>
          </Container>
        </section>
      ) : null}
    </>
  );
}
