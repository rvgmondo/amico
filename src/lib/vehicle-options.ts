/**
 * Canonical option lists for vehicle attributes. Shared by the Payload schema
 * (select fields), the seed script, and the public faceted-search UI so values,
 * labels and URL params never drift apart. `value` is URL-safe (used in filters).
 */
export type Option = { label: string; value: string };

export const BODY_TYPES: Option[] = [
  { label: "SUV", value: "suv" },
  { label: "Hatchback", value: "hatchback" },
  { label: "Sedan", value: "sedan" },
  { label: "Bakkie (Single Cab)", value: "single-cab" },
  { label: "Double Cab", value: "double-cab" },
  { label: "Coupe", value: "coupe" },
  { label: "MPV", value: "mpv" },
  { label: "Wagon", value: "wagon" },
  { label: "Crossover", value: "crossover" },
];

export const FUEL_TYPES: Option[] = [
  { label: "Petrol", value: "petrol" },
  { label: "Diesel", value: "diesel" },
  { label: "Hybrid", value: "hybrid" },
  { label: "Electric", value: "electric" },
];

export const TRANSMISSIONS: Option[] = [
  { label: "Manual", value: "manual" },
  { label: "Automatic", value: "automatic" },
];

export const DRIVETRAINS: Option[] = [
  { label: "Front-wheel drive", value: "fwd" },
  { label: "Rear-wheel drive", value: "rwd" },
  { label: "All-wheel drive", value: "awd" },
  { label: "4x4", value: "4x4" },
  { label: "4x2", value: "4x2" },
];

export const CONDITIONS: Option[] = [
  { label: "Used", value: "used" },
  { label: "Demo", value: "demo" },
  { label: "New", value: "new" },
];

export const VEHICLE_STATUSES: Option[] = [
  { label: "Available", value: "available" },
  { label: "Reserved", value: "reserved" },
  { label: "Sold", value: "sold" },
];

export const labelFor = (options: Option[], value?: string | null): string =>
  options.find((o) => o.value === value)?.label ?? (value ?? "");
