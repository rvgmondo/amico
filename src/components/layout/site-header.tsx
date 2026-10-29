"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Heart, Menu, MessageCircle, Phone, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { LanguageSwitch, useT } from "@/components/i18n";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { useFavourites } from "@/lib/favourites";
import { cn } from "@/lib/utils";

function SavedLink() {
  const { count, ready } = useFavourites();
  const { t } = useT();
  return (
    <Link
      href="/saved"
      aria-label={t.common.saved(ready ? count : 0)}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Heart className="size-[18px]" />
      {ready && count > 0 ? (
        <span className="absolute -right-1 -top-1 inline-flex size-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
          {count}
        </span>
      ) : null}
    </Link>
  );
}

type NavLink = { label: string; url: string };

export function SiteHeader({
  links,
  cta,
  phone,
  whatsappHref,
}: {
  links: NavLink[];
  cta?: { label: string; url: string } | null;
  phone?: string | null;
  whatsappHref?: string | null;
}) {
  const pathname = usePathname();
  const { t } = useT();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => setOpen(false), [pathname]);

  const isActive = (url: string) => (url === "/" ? pathname === "/" : pathname.startsWith(url));

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-4 lg:h-[70px]">
        <Link
          href="/"
          aria-label={t.common.homeAria}
          className="flex items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Image
            src="/logo.png"
            alt="Amico Motors"
            width={877}
            height={461}
            priority
            className="h-11 w-auto sm:h-12 dark:rounded-md dark:bg-white/95 dark:px-2 dark:py-1"
          />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <Link
              key={link.url}
              href={link.url}
              aria-current={isActive(link.url) ? "page" : undefined}
              className={cn(
                "rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                isActive(link.url) && "text-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {phone ? (
            <a
              href={`tel:${phone.replace(/[^\d+]/g, "")}`}
              className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted xl:inline-flex"
            >
              <Phone className="size-4 text-accent" />
              {phone}
            </a>
          ) : null}
          <SavedLink />
          <LanguageSwitch className="hidden sm:inline-flex" />
          <ThemeToggle className="hidden sm:inline-flex" />
          {cta ? (
            <Button asChild variant="accent" size="sm" className="hidden sm:inline-flex">
              <Link href={cta.url}>{cta.label}</Link>
            </Button>
          ) : null}

          {/* Mobile menu */}
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
              <button
                type="button"
                aria-label={t.common.openMenu}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:hidden"
              >
                <Menu className="size-5" />
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in data-[state=closed]:fade-out" />
              <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-[85%] max-w-sm flex-col gap-1 border-l border-border bg-background p-6 shadow-xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right">
                <div className="mb-4 flex items-center justify-between">
                  <Dialog.Title className="font-display text-lg font-bold">{t.common.menu}</Dialog.Title>
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      aria-label={t.common.closeMenu}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <X className="size-5" />
                    </button>
                  </Dialog.Close>
                </div>
                <nav aria-label="Mobile" className="flex flex-col">
                  {links.map((link) => (
                    <Link
                      key={link.url}
                      href={link.url}
                      className="rounded-lg px-3 py-3 text-base font-medium text-foreground hover:bg-muted"
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
                <div className="mt-4 flex flex-col gap-3">
                  {cta ? (
                    <Button asChild variant="accent" className="w-full">
                      <Link href={cta.url}>{cta.label}</Link>
                    </Button>
                  ) : null}
                  {whatsappHref ? (
                    <Button asChild variant="whatsapp" className="w-full">
                      <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="size-4" /> {t.common.whatsappUs}
                      </a>
                    </Button>
                  ) : null}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm text-muted-foreground">{t.common.language}</span>
                    <LanguageSwitch />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm text-muted-foreground">{t.common.theme}</span>
                    <ThemeToggle />
                  </div>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </Container>
    </header>
  );
}
