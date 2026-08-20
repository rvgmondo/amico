"use server";

import config from "@payload-config";
import { headers } from "next/headers";
import { getPayload } from "payload";

import { type SubmissionInput, submissionSchema } from "@/lib/enquiry-schema";

export type EnquiryResult = { ok: true } | { ok: false; error: string };

// Simple in-memory rate limiter (per server instance).
const buckets = new Map<string, number[]>();
const MAX_PER_WINDOW = 6;
const WINDOW_MS = 10 * 60 * 1000;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (buckets.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) return true;
  recent.push(now);
  buckets.set(ip, recent);
  return false;
}

function leadEmailHtml(d: SubmissionInput): string {
  const rows: [string, string | undefined][] = [
    ["Type", d.type],
    ["Name", d.name],
    ["Email", d.email || undefined],
    ["Phone", d.phone || undefined],
    ["Vehicle", d.vehicleTitle || undefined],
    ["Preferred date", d.preferredDate || undefined],
    ["Message", d.message || undefined],
    ["Source", d.source || undefined],
  ];
  const detailRows = d.details
    ? Object.entries(d.details).map(
        ([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#666">${k}</td><td>${String(v)}</td></tr>`,
      )
    : [];
  const body = rows
    .filter(([, v]) => v)
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#666">${k}</td><td>${v}</td></tr>`)
    .join("");
  return `<div style="font-family:Arial,sans-serif">
    <h2 style="color:#1a2557">New ${d.type} lead</h2>
    <table>${body}${detailRows.join("")}</table>
    <p style="color:#999;font-size:12px">Sent from the Amico Motors website.</p>
  </div>`;
}

export async function submitEnquiry(raw: unknown): Promise<EnquiryResult> {
  const parsed = submissionSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }
  const data = parsed.data;

  // Honeypot: silently accept (don't tip off bots) but store nothing.
  if (data.company) return { ok: true };

  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "local").trim();
  if (rateLimited(ip)) {
    return { ok: false, error: "Too many submissions. Please try again in a few minutes." };
  }

  try {
    const payload = await getPayload({ config });
    await payload.create({
      collection: "enquiries",
      overrideAccess: true,
      data: {
        type: data.type,
        status: "new",
        name: data.name,
        email: data.email || undefined,
        phone: data.phone || undefined,
        message: data.message || undefined,
        vehicle: data.vehicleId,
        preferredDate: data.preferredDate,
        consent: data.consent ?? false,
        details: data.details,
        source: data.source,
      },
    });

    const to = process.env.LEADS_NOTIFY_TO || "amelda@amicomotors.co.za";
    await payload
      .sendEmail({ to, subject: `New ${data.type} lead: ${data.name}`, html: leadEmailHtml(data) })
      .catch((err: unknown) => payload.logger.error(`Lead email failed: ${String(err)}`));

    return { ok: true };
  } catch (err) {
    console.error("submitEnquiry failed", err);
    return { ok: false, error: "Something went wrong. Please try again, or call us directly." };
  }
}
