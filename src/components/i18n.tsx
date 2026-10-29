"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { dictFor, LANG_COOKIE, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const LangContext = React.createContext<Lang>("en");

/** Hands the server's language to client components. Set once in the frontend layout. */
export function LangProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

/** The language and its words, for client components. */
export function useT() {
  const lang = React.useContext(LangContext);
  return { lang, t: dictFor(lang) };
}

/** EN | AF. Remembers the choice for a year and redraws the page in that language. */
export function LanguageSwitch({ className }: { className?: string }) {
  const { lang, t } = useT();
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const choose = (next: Lang) => {
    if (next === lang) return;
    document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = next;
    startTransition(() => router.refresh());
  };
  return (
    <div
      role="group"
      aria-label={t.common.language}
      className={cn(
        "inline-flex h-10 items-center rounded-full border border-border p-0.5 text-xs font-bold",
        pending && "opacity-60",
        className,
      )}
    >
      {(["en", "af"] as const).map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={lang === l}
          onClick={() => choose(l)}
          className={cn(
            "h-full rounded-full px-2.5 tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
