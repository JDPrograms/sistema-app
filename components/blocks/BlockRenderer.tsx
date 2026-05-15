import GalleryBlock from "./GalleryBlock";
import StatsBlock from "./StatsBlock";
import TestimonialsBlock from "./TestimonialsBlock";
import FaqBlock from "./FaqBlock";
import CtaBlock from "./CtaBlock";
import TextBlock from "./TextBlock";

export interface PageBlock {
  id: string;
  type: "gallery" | "stats" | "testimonials" | "faq" | "cta" | "text";
  config: any;
  order: number;
}

export default function BlockRenderer({
  blocksJson,
  primaryColor,
  secondaryColor,
}: {
  blocksJson: string;
  primaryColor: string;
  secondaryColor: string;
}) {
  let blocks: PageBlock[] = [];
  try { blocks = JSON.parse(blocksJson || "[]"); } catch {}
  if (!blocks.length) return null;

  const sorted = [...blocks].sort((a, b) => a.order - b.order);

  return (
    <>
      {sorted.map((block) => {
        switch (block.type) {
          case "gallery":
            return <GalleryBlock key={block.id} config={block.config} primaryColor={primaryColor} />;
          case "stats":
            return <StatsBlock key={block.id} config={block.config} primaryColor={primaryColor} />;
          case "testimonials":
            return <TestimonialsBlock key={block.id} config={block.config} primaryColor={primaryColor} />;
          case "faq":
            return <FaqBlock key={block.id} config={block.config} primaryColor={primaryColor} />;
          case "cta":
            return <CtaBlock key={block.id} config={block.config} primaryColor={primaryColor} secondaryColor={secondaryColor} />;
          case "text":
            return <TextBlock key={block.id} config={block.config} primaryColor={primaryColor} />;
          default:
            return null;
        }
      })}
    </>
  );
}
