export interface TemplateRecord {
  id: string;
  name: string;
  slug: string;
  category: string;
  niche: string;
  description: string;
  directory: string;
  colorHex: string;
  colorName: string;
  isActive: boolean; // Controls whether regular users can see this in creation wizard!
  isDefault?: boolean;
  version?: string; // e.g. "v1", "v1.1"
  availablePlans?: string[]; // e.g. ["free", "starter", "pro", "agency"]
  sortOrder?: number;
  previewImage?: string;
}

export const DEFAULT_TEMPLATES: TemplateRecord[] = [
  {
    id: "plumber-pro",
    name: "Plumber Pro",
    slug: "plumber-pro",
    category: "Plumbing Services",
    niche: "Plumbing, Drains, Water Heaters & Rooter Services",
    description:
      "Engineered specifically for residential & commercial plumbers. Features licensed master plumber trust signals, leak repair showcases, and solid high-contrast conversion styling.",
    directory: "plumber-pro",
    colorHex: "#1e3a8a",
    colorName: "Solid Royal Slate Blue",
    isActive: true,
    isDefault: true,
    version: "v1",
    availablePlans: ["free", "starter", "pro", "agency"],
    sortOrder: 1,
  },
  {
    id: "water-damage-master",
    name: "Water Damage Restoration",
    slug: "water-damage-master",
    category: "Emergency & Disaster",
    niche: "Flood Extraction, Structural Drying & Mold Remediation",
    description:
      "Engineered specifically for 24/7 disaster extraction and flood cleanup. Features high-urgency emergency dispatch bars, 60-minute response guarantees, and insurance claim helpers.",
    directory: "water-damage",
    colorHex: "#dc2626",
    colorName: "Emergency Red & Slate",
    isActive: true,
    isDefault: false,
    version: "v1",
    availablePlans: ["starter", "pro", "agency"],
    sortOrder: 2,
  },
];
