export interface SectionLayout {
  key: string;
  order: number;
  hidden?: boolean;
  minHeight?: number | null;
  maxHeight?: number | null;
  paddingY?: number | null;
  paddingX?: number | null;
  width?: string | null;
  bgColor?: string | null;
  bgImage?: string | null;
  bgOverlay?: number | null;
  textColor?: string | null;
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
): React.CSSProperties & { order: number } {
  const s = config.sections?.find((s) => s.key === key);
  if (!s) return { order: defaultOrder };

  const style: React.CSSProperties & { order: number } = { order: s.order ?? defaultOrder };

  if (s.hidden) style.display = "none";
  if (s.minHeight) style.minHeight = `${s.minHeight}px`;
  if (s.maxHeight) style.maxHeight = `${s.maxHeight}px`;
  if (s.paddingY != null) { style.paddingTop = `${s.paddingY}px`; style.paddingBottom = `${s.paddingY}px`; }
  if (s.paddingX != null) { style.paddingLeft = `${s.paddingX}px`; style.paddingRight = `${s.paddingX}px`; }
  if (s.width && s.width !== "100%") { style.maxWidth = s.width; style.marginLeft = "auto"; style.marginRight = "auto"; }
  if (s.bgColor) style.backgroundColor = s.bgColor;
  if (s.bgImage) {
    const ov = (s.bgOverlay ?? 0) / 100;
    style.backgroundImage = ov > 0
      ? `linear-gradient(rgba(0,0,0,${ov}),rgba(0,0,0,${ov})),url(${s.bgImage})`
      : `url(${s.bgImage})`;
    style.backgroundSize = "cover";
    style.backgroundPosition = "center";
  }
  if (s.textColor) style.color = s.textColor;

  return style;
}
