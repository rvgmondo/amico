import { RichText as LexicalRichText } from "@payloadcms/richtext-lexical/react";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";

import { cn } from "@/lib/utils";

/** Renders Payload lexical rich text with brand styling. */
export function RichText({
  data,
  className,
}: {
  data?: SerializedEditorState | null;
  className?: string;
}) {
  if (!data) return null;
  return (
    <div className={cn("rich-text", className)}>
      <LexicalRichText data={data} />
    </div>
  );
}
