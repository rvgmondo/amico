import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { RichText } from "@/components/rich-text";
import { Container } from "@/components/ui/container";
import { formatDate } from "@/lib/format";
import { getPostBySlug, mediaUrl } from "@/lib/payload";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Article not found" };
  const cover = typeof post.coverImage === "object" ? post.coverImage : null;
  const og = mediaUrl(cover, "og");
  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: { title: post.title, description: post.excerpt ?? undefined, images: og ? [og] : undefined, type: "article" },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const cover = typeof post.coverImage === "object" ? post.coverImage : null;
  const src = mediaUrl(cover, "feature");
  const category = typeof post.category === "object" ? post.category : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    datePublished: post.publishedDate,
    author: { "@type": "Organization", name: post.author || "Amico Motors" },
    publisher: { "@type": "Organization", name: "Amico Motors" },
    image: src ?? undefined,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Container className="py-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <ChevronRight className="size-3.5" />
          <Link href="/blog" className="hover:text-foreground">News</Link>
          <ChevronRight className="size-3.5" />
          <span className="line-clamp-1 text-foreground">{post.title}</span>
        </nav>
      </Container>

      <article className="pb-16">
        <Container className="flex max-w-3xl flex-col gap-6">
          <header className="flex flex-col gap-3">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {category ? <span className="font-semibold text-accent">{category.title}</span> : null}
              {post.publishedDate ? <span>{formatDate(post.publishedDate)}</span> : null}
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{post.title}</h1>
            {post.excerpt ? <p className="text-lg text-muted-foreground">{post.excerpt}</p> : null}
          </header>

          {src ? (
            <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-border">
              <Image src={src} alt={cover?.alt || post.title} fill priority sizes="768px" className="object-cover" />
            </div>
          ) : null}

          <RichText data={post.content as never} />
        </Container>
      </article>
    </>
  );
}
