import { prisma } from "@/lib/prisma";
import Link from "next/link";
import MarketingNav from "@/components/marketing/MarketingNav";
import { getLocale } from "next-intl/server";

const TEMPLATE_MAP: Record<string, { label: string; emoji: string }> = {
  barbershop:  { label: "Barbería / Salón",    emoji: "✂️" },
  salon:       { label: "Salón de belleza",     emoji: "💅" },
  restaurant:  { label: "Restaurante / Café",   emoji: "🍕" },
  gym:         { label: "Gimnasio / Fitness",   emoji: "💪" },
  clinic:      { label: "Clínica / Salud",      emoji: "🏥" },
  school:      { label: "Escuela / Tutorías",   emoji: "🏫" },
  veterinary:  { label: "Veterinaria",          emoji: "🐾" },
  lawyer:      { label: "Estudio Jurídico",     emoji: "⚖️" },
  realestate:  { label: "Inmobiliaria",         emoji: "🏠" },
  hotel:       { label: "Hotel / Alojamiento",  emoji: "🏨" },
  hardware:    { label: "Ferretería / Tienda",  emoji: "🔧" },
  generic:     { label: "Negocio general",      emoji: "🏪" },
  photographer:{ label: "Fotografía",           emoji: "📷" },
  tutor:       { label: "Tutor / Academia",     emoji: "📚" },
  pharmacy:    { label: "Farmacia",             emoji: "💊" },
  store:       { label: "Tienda / Comercio",    emoji: "🛍️" },
  dentist:     { label: "Odontología",          emoji: "🦷" },
};

const ALL_TYPES = Object.entries(TEMPLATE_MAP).map(([value, { label }]) => ({ value, label }));

export default async function DirectorioPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tipo?: string }>;
}) {
  const { q = "", tipo = "" } = await searchParams;
  const locale = await getLocale();

  const sites = await prisma.site.findMany({
    where: {
      isActive: true,
      ...(q.trim() ? { name: { contains: q.trim(), mode: "insensitive" } } : {}),
      ...(tipo ? { template: tipo } : {}),
    },
    select: {
      slug:         true,
      name:         true,
      description:  true,
      template:     true,
      primaryColor: true,
      logoUrl:      true,
      address:      true,
      phone:        true,
    },
    orderBy: { name: "asc" },
    take: 100,
  });

  const navT = {
    features:  locale === "es" ? "Características" : "Features",
    templates: locale === "es" ? "Plantillas"       : "Templates",
    pricing:   locale === "es" ? "Precios"          : "Pricing",
    login:     locale === "es" ? "Iniciar sesión"   : "Sign in",
    start:     locale === "es" ? "Comenzar gratis"  : "Get started free",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MarketingNav locale={locale} t={navT} />

      <div className="pt-24 pb-16 px-4">
        {/* Header */}
        <div className="max-w-5xl mx-auto text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
            {locale === "es" ? "Directorio de negocios" : "Business Directory"}
          </h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            {locale === "es"
              ? "Descubre negocios locales registrados en nuestra plataforma"
              : "Discover local businesses registered on our platform"}
          </p>
        </div>

        {/* Filters */}
        <form method="GET" className="max-w-5xl mx-auto flex flex-col sm:flex-row gap-3 mb-8">
          <input
            name="q"
            defaultValue={q}
            placeholder={locale === "es" ? "Buscar negocio por nombre..." : "Search business by name..."}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
          <select
            name="tipo"
            defaultValue={tipo}
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{locale === "es" ? "Todos los tipos" : "All types"}</option>
            {ALL_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          >
            {locale === "es" ? "Buscar" : "Search"}
          </button>
          {(q || tipo) && (
            <Link
              href="/directorio"
              className="border border-gray-200 hover:bg-gray-100 text-gray-600 px-4 py-2.5 rounded-xl text-sm transition-colors text-center"
            >
              {locale === "es" ? "Limpiar" : "Clear"}
            </Link>
          )}
        </form>

        {/* Results count */}
        <div className="max-w-5xl mx-auto mb-4 text-sm text-gray-400">
          {sites.length === 0
            ? (locale === "es" ? "No se encontraron negocios" : "No businesses found")
            : locale === "es"
              ? `${sites.length} negocio${sites.length !== 1 ? "s" : ""} encontrado${sites.length !== 1 ? "s" : ""}`
              : `${sites.length} business${sites.length !== 1 ? "es" : ""} found`
          }
        </div>

        {/* Grid */}
        {sites.length === 0 ? (
          <div className="max-w-5xl mx-auto text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-500 text-lg">
              {locale === "es" ? "No se encontraron negocios con esos criterios" : "No businesses found with those criteria"}
            </p>
            <Link href="/directorio" className="mt-4 inline-block text-blue-600 hover:underline text-sm">
              {locale === "es" ? "Ver todos" : "View all"}
            </Link>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {sites.map((site) => {
              const tmpl = TEMPLATE_MAP[site.template] ?? { label: site.template, emoji: "🏪" };
              return (
                <Link
                  key={site.slug}
                  href={`/site/${site.slug}`}
                  className="group bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-blue-100 transition-all"
                >
                  <div className="flex items-start gap-3 mb-3">
                    {site.logoUrl ? (
                      <img
                        src={site.logoUrl}
                        alt={site.name}
                        className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-gray-100"
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                        style={{ backgroundColor: site.primaryColor || "#3b82f6" }}
                      >
                        {site.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h2 className="font-bold text-gray-900 text-base leading-tight truncate group-hover:text-blue-600 transition-colors">
                        {site.name}
                      </h2>
                      <span className="inline-flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                        {tmpl.emoji} {tmpl.label}
                      </span>
                    </div>
                  </div>

                  {site.description && (
                    <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-3">
                      {site.description}
                    </p>
                  )}

                  <div className="space-y-1">
                    {site.address && (
                      <p className="text-xs text-gray-400 flex items-center gap-1.5">
                        <span>📍</span> {site.address}
                      </p>
                    )}
                    {site.phone && (
                      <p className="text-xs text-gray-400 flex items-center gap-1.5">
                        <span>📞</span> {site.phone}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                    <span className="text-xs text-gray-400">/{site.slug}</span>
                    <span className="text-xs font-medium text-blue-600 group-hover:underline">
                      {locale === "es" ? "Ver sitio →" : "View site →"}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 px-4 text-center text-sm">
        <Link href="/" className="hover:text-white transition-colors">← {locale === "es" ? "Volver al inicio" : "Back to home"}</Link>
        <span className="mx-3 text-slate-700">·</span>
        <span>© {new Date().getFullYear()} Sistema de Sistemas</span>
      </footer>
    </div>
  );
}
