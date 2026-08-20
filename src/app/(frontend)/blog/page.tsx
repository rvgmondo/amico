import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { formatDate } from "@/lib/format";
import { getPosts, mediaUrl } from "@/lib/payload";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "News",
  description: "News and updates from Amico Motors — new stock, finance specials and dealership news.",
  alternates: { canonical: "/blog" },
};

export default async function BlogPage() {
  const posts = await getPosts(24);

  return (
    <>
      <PageHero eyebrow="News" title="News & updates" description="New stock arrivals, finance specials and dealership news." />
      <Container className="py-12">
        {posts.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => {
              const cover = typeof post.coverImage === "object" ? post.coverImage : null;
              const src = mediaUrl(cover, "card");
              const category = typeof post.category === "object" ? post.category : null;
              return (
                <article key={post.id} className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)] transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]">
                  <Link href={`/blog/${post.slug}`} className="flex flex-1 flex-col">
                    <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                      {src ? (
                        <Image src={src} alt={cover?.alt || post.title} fill sizes="400px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-navy-gradient font-display text-2xl font-bold text-white/80">
                          Amico Motors
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-2 p-5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {category ? <Badge variant="goldSoft">{category.title}</Badge> : null}
                        {post.publishedDate ? <span>{formatDate(post.publishedDate)}</span> : null}
                      </div>
                      <h2 className="font-display text-lg font-bold leading-tight">{post.title}</h2>
                      {post.excerpt ? <p className="line-clamp-3 text-sm text-muted-foreground">{post.excerpt}</p> : null}
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border py-20 text-center">
            <p className="font-display text-lg font-bold">No articles yet</p>
            <p className="mt-2 text-sm text-muted-foreground">Check back soon for news and updates.</p>
          </div>
        )}
      </Container>
    </>
  );
}
