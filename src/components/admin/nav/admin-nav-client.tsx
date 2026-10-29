"use client";

import { NavHamburger, NavWrapper } from "@payloadcms/next/client";
import { Link, useNav, usePreferences, useTranslation } from "@payloadcms/ui";
import { usePathname } from "next/navigation";
import { PREFERENCE_KEYS } from "payload/shared";
import { useEffect, useId, useRef, useState } from "react";

import { AdminIcon } from "../brand/admin-logo";

export type NavEntity = { label: string; href: string };
export type NavSection = { label: string; entities: NavEntity[]; open: boolean };

const isCurrent = (pathname: string, href: string, exact: boolean) =>
  exact ? pathname === href || pathname === `${href}/` : pathname === href || pathname.startsWith(`${href}/`);

function NavLink({ entity, current }: { entity: NavEntity; current: boolean }) {
  return (
    <Link
      className={`nav__link am-admin-nav__link${current ? " am-admin-nav__link--current" : ""}`}
      href={entity.href}
      prefetch={false}
      aria-current={current ? "page" : undefined}
    >
      <span className="nav__link-label">{entity.label}</span>
    </Link>
  );
}

function Section({ section, pathname }: { section: NavSection; pathname: string }) {
  const listId = useId();
  const { setPreference } = usePreferences();
  const holdsCurrent = section.entities.some((e) => isCurrent(pathname, e.href, false));
  // A folded group opens when the page being shown lives inside it.
  const [open, setOpen] = useState(section.open || holdsCurrent);
  useEffect(() => {
    if (holdsCurrent) setOpen(true);
  }, [holdsCurrent]);

  return (
    <div className="am-admin-nav__group">
      <button
        type="button"
        className="am-admin-nav__toggle"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          const next = !open;
          setOpen(next);
          void setPreference(PREFERENCE_KEYS.NAV, { groups: { [section.label]: { open: next } } }, true);
        }}
      >
        <span>{section.label}</span>
        <span aria-hidden="true" className="am-admin-nav__chevron">
          {open ? "−" : "+"}
        </span>
      </button>
      <ul id={listId} className="am-admin-nav__list" hidden={!open}>
        {section.entities.map((e) => (
          <li key={e.href}>
            <NavLink entity={e} current={isCurrent(pathname, e.href, false)} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Payload closes its menu on every screen up to 1440px wide, which is most laptops, so the menu
 * is reopened once on screens from 1200px, after Payload's own first-load check. From Rynet.
 */
function useOpenOnLaptops() {
  const { hydrated, setNavOpen } = useNav();
  const done = useRef(false);
  useEffect(() => {
    if (!hydrated || done.current) return;
    done.current = true;
    if (!window.matchMedia("(min-width: 1200px) and (max-width: 1440px)").matches) return;
    window.setTimeout(() => setNavOpen(true), 0);
  }, [hydrated, setNavOpen]);
}

const WORDS = {
  en: { add: "+ Add a car", home: "Home", site: "View the website", newTab: " (opens in a new tab)", out: "Sign out", by: "Built and cared for by Rynet", lang: "Language" },
  af: { add: "+ Laai 'n kar", home: "Tuis", site: "Sien die webblad", newTab: " (maak oop in 'n nuwe oortjie)", out: "Meld af", by: "Gebou en versorg deur Rynet", lang: "Taal" },
};

/** EN | AF. Payload remembers the choice per browser and redraws the admin in that language. */
function LanguageSwitch({ lang }: { lang: "en" | "af" }) {
  const { switchLanguage } = useTranslation();
  return (
    <div className="am-admin-lang" role="group" aria-label={WORDS[lang].lang}>
      {(["en", "af"] as const).map((l) => (
        <button
          key={l}
          type="button"
          className="am-admin-lang__btn"
          aria-pressed={lang === l}
          onClick={() => {
            // Payload types only its own languages; "af" is ours (src/i18n/af.ts).
            if (l !== lang) void switchLanguage?.(l as never);
          }}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export function AdminNavClient({
  lang,
  adminRoute,
  logoutHref,
  primary,
  sections,
}: {
  lang: "en" | "af";
  adminRoute: string;
  logoutHref: string;
  primary: NavEntity[];
  sections: NavSection[];
}) {
  const pathname = usePathname() ?? "";
  const w = WORDS[lang];
  useOpenOnLaptops();
  return (
    <NavWrapper baseClass="nav">
      <nav className="nav__wrap am-admin-nav" aria-label="Admin menu">
        <div className="am-admin-nav__brand">
          <AdminIcon />
          <span className="am-admin-nav__word">
            Amico <span>Motors</span>
          </span>
        </div>

        <Link className="am-admin-nav__add" href={`${adminRoute}/collections/vehicles/create`} prefetch={false}>
          {w.add}
        </Link>

        <ul className="am-admin-nav__list am-admin-nav__list--primary">
          <li>
            <NavLink entity={{ label: w.home, href: adminRoute }} current={isCurrent(pathname, adminRoute, true)} />
          </li>
          {primary.map((e) => (
            <li key={e.href}>
              <NavLink entity={e} current={isCurrent(pathname, e.href, false)} />
            </li>
          ))}
        </ul>

        {sections.map((s) => (
          <Section key={s.label} section={s} pathname={pathname} />
        ))}

        <div className="nav__controls am-admin-nav__controls">
          <a className="am-admin-nav__control" href="/" target="_blank" rel="noopener noreferrer">
            {w.site}
            <span className="sr-only">{w.newTab}</span>
          </a>
          <Link className="am-admin-nav__control" href={logoutHref} prefetch={false}>
            {w.out}
          </Link>
          <LanguageSwitch lang={lang} />
          <p className="am-admin-nav__by">{w.by}</p>
        </div>
      </nav>
      <div className="nav__header">
        <div className="nav__header-content">
          <NavHamburger baseClass="nav" />
        </div>
      </div>
    </NavWrapper>
  );
}
