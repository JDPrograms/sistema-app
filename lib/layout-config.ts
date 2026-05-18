export interface SectionLayout {
  key: string;
  order: number;
  minHeight?: number | null;
  hidden?: boolean;
}

export interface HeroData {
  title?: string;
  subtitle?: string;
  bgImage?: string;
  overlay?: number;
  ctaText?: string;
  ctaUrl?: string;
  align?: "left" | "center" | "right";
}

export interface LayoutConfig {
  sections?: SectionLayout[];
  heroData?: HeroData;
}

export function parseLayoutConfig(json: string | null | undefined): LayoutConfig {
  if (!json) return {};
  try { return JSON.parse(json) || {}; } catch { return {}; }
}

export function getSecStyle(
  config: LayoutConfig,
  key: string,
  defaultOrder: number
): { order: number; minHeight?: string; display?: string } {
  const s = config.sections?.find((s) => s.key === key);
  return {
    order: s?.order ?? defaultOrder,
    ...(s?.minHeight ? { minHeight: `${s.minHeight}px` } : {}),
    ...(s?.hidden ? { display: "none" } : {}),
  };
}
