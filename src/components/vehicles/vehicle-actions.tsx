"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Banknote, CalendarDays, Mail, MessageCircle, X } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { EnquiryForm } from "@/components/forms/enquiry-form";
import { Button } from "@/components/ui/button";
import { SaveButton } from "@/components/vehicles/save-button";

function ActionDialog({
  title,
  trigger,
  children,
}: {
  title: string;
  trigger: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[92vh] w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-y-auto rounded-2xl border border-border bg-background p-6 shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=open]:zoom-in-95">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="font-display text-xl font-bold">{title}</Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function VehicleActions({
  vehicle,
  whatsapp,
}: {
  vehicle: { id: number; title: string; slug: string };
  whatsapp?: { number: string } | null;
}) {
  const url =
    typeof window !== "undefined"
      ? window.location.href
      : `https://amicomotors.co.za/vehicles/${vehicle.slug}`;
  const waHref = whatsapp?.number
    ? `https://wa.me/${whatsapp.number}?text=${encodeURIComponent(
        `Hi, I'm interested in the ${vehicle.title}. Is it still available?`,
      )}`
    : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <ActionDialog
          title="Enquire about this vehicle"
          trigger={
            <Button variant="accent" className="w-full">
              <Mail className="size-4" /> Enquire
            </Button>
          }
        >
          <EnquiryForm type="vehicle" vehicle={{ id: vehicle.id, title: vehicle.title }} compact />
        </ActionDialog>

        <ActionDialog
          title="Book a test drive"
          trigger={
            <Button variant="outline" className="w-full">
              <CalendarDays className="size-4" /> Test drive
            </Button>
          }
        >
          <EnquiryForm type="test-drive" vehicle={{ id: vehicle.id, title: vehicle.title }} compact />
        </ActionDialog>
      </div>

      <Button asChild variant="secondary" className="w-full">
        <Link href={`/finance?vehicle=${encodeURIComponent(vehicle.slug)}`}>
          <Banknote className="size-4" /> Apply for finance
        </Link>
      </Button>

      <div className="grid grid-cols-[1fr_auto] gap-3">
        {waHref ? (
          <Button asChild variant="whatsapp" className="w-full">
            <a href={waHref} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="size-4" /> WhatsApp about this car
            </a>
          </Button>
        ) : (
          <span />
        )}
        <SaveButton id={vehicle.id} />
      </div>
    </div>
  );
}
