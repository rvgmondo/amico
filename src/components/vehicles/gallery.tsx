"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import Image from "next/image";
import * as React from "react";

import { cn } from "@/lib/utils";

export type Photo = { full: string; thumb: string; alt: string };

export function Gallery({ photos, title }: { photos: Photo[]; title: string }) {
  const [active, setActive] = React.useState(0);
  const [open, setOpen] = React.useState(false);

  if (!photos.length) {
    return (
      <div className="flex aspect-[16/10] items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground">
        No photos available
      </div>
    );
  }

  const go = (dir: number) =>
    setActive((i) => (i + dir + photos.length) % photos.length);

  return (
    <div className="flex flex-col gap-3">
      <div className="group relative aspect-[16/10] overflow-hidden rounded-xl border border-border bg-muted">
        <Image
          key={photos[active].full}
          src={photos[active].full}
          alt={photos[active].alt}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 720px"
          className="object-cover"
        />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open full-screen gallery"
          className="absolute bottom-3 right-3 inline-flex h-10 items-center gap-2 rounded-full bg-black/60 px-4 text-sm font-medium text-white backdrop-blur transition-colors hover:bg-black/80"
        >
          <Expand className="size-4" /> {photos.length} photos
        </button>
        {photos.length > 1 ? (
          <>
            <GalleryArrow side="left" onClick={() => go(-1)} />
            <GalleryArrow side="right" onClick={() => go(1)} />
          </>
        ) : null}
      </div>

      {photos.length > 1 ? (
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
          {photos.slice(0, 12).map((p, i) => (
            <button
              key={p.thumb}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View photo ${i + 1}`}
              aria-current={i === active}
              className={cn(
                "relative aspect-square overflow-hidden rounded-md border-2 transition-colors",
                i === active ? "border-accent" : "border-transparent hover:border-border",
              )}
            >
              <Image src={p.thumb} alt="" fill sizes="100px" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      {/* Lightbox */}
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/90 data-[state=open]:animate-in data-[state=open]:fade-in" />
          <Dialog.Content
            className="fixed inset-0 z-50 flex flex-col focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") go(1);
              if (e.key === "ArrowLeft") go(-1);
            }}
          >
            <Dialog.Title className="sr-only">{title} — photo gallery</Dialog.Title>
            <div className="flex items-center justify-between p-4 text-white">
              <span className="text-sm font-medium">
                {active + 1} / {photos.length}
              </span>
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Close gallery"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
                >
                  <X className="size-5" />
                </button>
              </Dialog.Close>
            </div>
            <div className="relative flex-1">
              <Image
                key={photos[active].full}
                src={photos[active].full}
                alt={photos[active].alt}
                fill
                sizes="100vw"
                className="object-contain"
              />
              {photos.length > 1 ? (
                <>
                  <GalleryArrow side="left" onClick={() => go(-1)} large />
                  <GalleryArrow side="right" onClick={() => go(1)} large />
                </>
              ) : null}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function GalleryArrow({
  side,
  onClick,
  large = false,
}: {
  side: "left" | "right";
  onClick: () => void;
  large?: boolean;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Previous photo" : "Next photo"}
      className={cn(
        "absolute top-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/75",
        side === "left" ? "left-3" : "right-3",
        large ? "h-12 w-12" : "h-10 w-10 opacity-0 group-hover:opacity-100",
      )}
    >
      <Icon className={large ? "size-6" : "size-5"} />
    </button>
  );
}
