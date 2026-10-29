import { cookies } from "next/headers";

import { dictFor, LANG_COOKIE, toLang, type Lang } from "@/lib/i18n";

/** The visitor's language, from the EN | AF cookie. English when unset. */
export async function getLang(): Promise<Lang> {
  return toLang((await cookies()).get(LANG_COOKIE)?.value);
}

/** The language and its words, for server components. */
export async function getT() {
  const lang = await getLang();
  return { lang, t: dictFor(lang) };
}
