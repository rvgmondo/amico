import { MessageCircle } from "lucide-react";

/** Floating WhatsApp contact button, their primary contact channel. */
export function WhatsAppButton({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#0B8457] text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B8457] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <MessageCircle className="size-7" />
    </a>
  );
}
