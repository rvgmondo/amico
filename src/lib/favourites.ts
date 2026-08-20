"use client";

import * as React from "react";

const KEY = "amico:favourites";
const EVENT = "amico-favourites-changed";

function read(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "number") : [];
  } catch {
    return [];
  }
}

export function useFavourites() {
  const [ids, setIds] = React.useState<number[]>([]);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    setIds(read());
    setReady(true);
    const sync = () => setIds(read());
    window.addEventListener("storage", sync);
    window.addEventListener(EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(EVENT, sync);
    };
  }, []);

  const toggle = React.useCallback((id: number) => {
    const cur = read();
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    localStorage.setItem(KEY, JSON.stringify(next));
    setIds(next);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { ids, ready, has: (id: number) => ids.includes(id), toggle, count: ids.length };
}
