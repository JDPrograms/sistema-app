import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import BlockRenderer from "@/components/blocks/BlockRenderer";
import AdsBanner from "@/components/AdsBanner";
import ChatWidget from "@/components/ai/ChatWidget";

// Original templates
import BarbershopTemplate from "@/components/templates/BarbershopTemplate";
import HardwareTemplate from "@/components/templates/HardwareTemplate";
import RestaurantTemplate from "@/components/templates/RestaurantTemplate";
import GenericTemplate from "@/components/templates/GenericTemplate";

// New templates
import GymTemplate from "@/components/templates/GymTemplate";
import ClinicTemplate from "@/components/templates/ClinicTemplate";
import SalonTemplate from "@/components/templates/SalonTemplate";
import SchoolTemplate from "@/components/templates/SchoolTemplate";
import VeterinaryTemplate from "@/components/templates/VeterinaryTemplate";
import LawyerTemplate from "@/components/templates/LawyerTemplate";
import RealEstateTemplate from "@/components/templates/RealEstateTemplate";
import HotelTemplate from "@/components/templates/HotelTemplate";

export default async function SitePublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await prisma.site.findUnique({
    where: { slug },
    include: {
      services: { where: { isActive: true }, orderBy: { createdAt: "asc" } },
      products: { where: { isActive: true }, orderBy: { createdAt: "asc" } },
      staff:    { where: { isActive: true }, orderBy: { createdAt: "asc" } },
      ads:      { where: { isActive: true }, orderBy: [{ order: "asc" }, { createdAt: "desc" }] },
    },
  });
  if (!site) notFound();

  // Raw SQL fallback for pageBlocks — Prisma binary may not include new fields if not regenerated
  const rawBlocks = await prisma.$queryRaw<{ pageBlocks: string | null }[]>`
    SELECT "pageBlocks" FROM "Site" WHERE slug = ${slug}
  `;
  const pageBlocksJson = rawBlocks[0]?.pageBlocks ?? "[]";

  const bannerAds = site.ads.filter((a) => a.type === "banner");
  const mods = (() => { try { return JSON.parse(site.modules || "{}"); } catch { return {}; } })();
  const appointmentsEnabled = mods.appointments !== false;
  const props = { site: site as any, appointmentsEnabled };

  let chatAgent = null;
  if (site.chatAgentId && mods.ai !== false) {
    chatAgent = await prisma.aiAgent.findUnique({ where: { id: site.chatAgentId, isActive: true } });
  }

  const templateMap: Record<string, React.ComponentType<any>> = {
    barbershop: BarbershopTemplate,
    hardware:   HardwareTemplate,
    restaurant: RestaurantTemplate,
    generic:    GenericTemplate,
    gym:        GymTemplate,
    clinic:     ClinicTemplate,
    salon:      SalonTemplate,
    school:     SchoolTemplate,
    veterinary: VeterinaryTemplate,
    lawyer:     LawyerTemplate,
    realestate: RealEstateTemplate,
    hotel:      HotelTemplate,
  };

  const TemplateComponent = templateMap[site.template] ?? GenericTemplate;

  return (
    <div>
      {bannerAds.length > 0 && <AdsBanner ads={bannerAds as any} primaryColor={site.primaryColor} />}

      <TemplateComponent {...props}>
        <BlockRenderer
          blocksJson={pageBlocksJson}
          primaryColor={site.primaryColor}
          secondaryColor={site.secondaryColor}
        />
      </TemplateComponent>

      <div className="fixed bottom-4 right-4 flex flex-col items-end gap-2 z-40">
        <Link
          href={`/site/${slug}/login`}
          className="bg-black/70 hover:bg-black text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm transition-colors"
        >
          Acceso admin
        </Link>
      </div>

      {chatAgent && (
        <ChatWidget
          agentId={chatAgent.id}
          agentName={chatAgent.name}
          siteSlug={slug}
          primaryColor={site.primaryColor}
        />
      )}
    </div>
  );
}
