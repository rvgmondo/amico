type LexNode = { type?: string; text?: string; children?: LexNode[] };
type LexData = { root?: { children?: LexNode[] } } | null | undefined;

/** Flatten Payload lexical rich text to plain text (for meta descriptions, etc.). */
export function lexicalToText(data: LexData, max = 180): string {
  const parts: string[] = [];
  const walk = (nodes?: LexNode[]) => {
    for (const n of nodes ?? []) {
      if (n.type === "text" && n.text) parts.push(n.text);
      if (n.children) walk(n.children);
    }
  };
  walk(data?.root?.children);
  const s = parts.join(" ").replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trim();
}
