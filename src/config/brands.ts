export const brandIds = [
  "jayalath-campus",
  "chiu-teng-lanka",
  "global-workforce",
  "overseas-vocational-training",
] as const;

export type BrandId = (typeof brandIds)[number];

export type LogoPlacement = {
  anchor: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  x: number;
  y: number;
  width: number;
  safeArea: number;
};

export type BrandProfile = {
  id: BrandId;
  name: string;
  shortName: string;
  primaryColor: string;
  accentColor: string;
  tone: string;
  logoPlacement: LogoPlacement;
};

export const brandProfiles: Record<BrandId, BrandProfile> = {
  "jayalath-campus": {
    id: "jayalath-campus",
    name: "Jayalath Campus",
    shortName: "JC",
    primaryColor: "#111827",
    accentColor: "#2563eb",
    tone: "premium education, trustworthy, polished",
    logoPlacement: { anchor: "bottom-right", x: 904, y: 904, width: 128, safeArea: 48 },
  },
  "chiu-teng-lanka": {
    id: "chiu-teng-lanka",
    name: "Chiu Teng Lanka",
    shortName: "CTL",
    primaryColor: "#0f766e",
    accentColor: "#f59e0b",
    tone: "professional workforce, clear, energetic",
    logoPlacement: { anchor: "top-right", x: 904, y: 48, width: 128, safeArea: 48 },
  },
  "global-workforce": {
    id: "global-workforce",
    name: "Global Workforce",
    shortName: "GW",
    primaryColor: "#7c2d12",
    accentColor: "#0284c7",
    tone: "global opportunity, reliable, human",
    logoPlacement: { anchor: "bottom-left", x: 48, y: 904, width: 128, safeArea: 48 },
  },
  "overseas-vocational-training": {
    id: "overseas-vocational-training",
    name: "Overseas Vocational Training",
    shortName: "OVT",
    primaryColor: "#14532d",
    accentColor: "#dc2626",
    tone: "practical training, aspirational, direct",
    logoPlacement: { anchor: "top-left", x: 48, y: 48, width: 128, safeArea: 48 },
  },
};
