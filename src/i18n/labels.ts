import type { Option } from "../lib/vehicle-options";

/**
 * Admin labels in English and Afrikaans. Payload shows the one for the language the person picked
 * (the EN | AF switch in the menu). The public site reads the plain English option lists in
 * src/lib/vehicle-options.ts and is not affected.
 */
export const b = (en: string, af: string) => ({ en, af });

/** A select's options with an Afrikaans label beside each English one. */
export const bilingual = (options: Option[], af: Record<string, string>) =>
  options.map((o) => ({ value: o.value, label: b(o.label, af[o.value] ?? o.label) }));

export const AF_OPTIONS = {
  bodyType: {
    suv: "SUV",
    hatchback: "Luikrug",
    sedan: "Sedan",
    "single-cab": "Bakkie (enkelkajuit)",
    "double-cab": "Dubbelkajuit",
    coupe: "Koepee",
    mpv: "MPV",
    wagon: "Stasiewa",
    crossover: "Crossover",
  },
  fuelType: { petrol: "Petrol", diesel: "Diesel", hybrid: "Hibried", electric: "Elektries" },
  transmission: { manual: "Handrat", automatic: "Outomaties" },
  drivetrain: {
    fwd: "Voorwielaandrywing",
    rwd: "Agterwielaandrywing",
    awd: "Vierwielaandrywing",
    "4x4": "4x4",
    "4x2": "4x2",
  },
  condition: { used: "Gebruik", demo: "Demo", new: "Nuut" },
  status: { available: "Beskikbaar", reserved: "Bespreek", sold: "Verkoop" },
};
