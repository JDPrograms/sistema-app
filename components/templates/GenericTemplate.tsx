import BookingSection from "@/components/booking/BookingSection";
import { parseLayoutConfig, getSecStyle } from "@/lib/layout-config";

interface Service { id: string; name: string; description?: string | null; price?: number | null; imageUrl?: string | null; }
interface Site {
  name: string; slug: string; description?: string; phone?: string;
  address?: string; email?: string; primaryColor: string; secondaryColor: string; logoUrl?: string;
  services: Service[];
}

export default function GenericTemplate({ site, appointmentsEnabled = true, children, layoutConfig }: { site: Site; appointmentsEnabled?: boolean; children?: React.ReactNode; layoutConfig?: string | null }) {
  const primary = site.primaryColor || "#6366f1";
  const layout = parseLayoutConfig(layoutConfig);
  const heroData = (layout as any).heroData || {};

  return (
    <div className="min-h-screen font-sans flex flex-col">
      <header className="bg-white border-b border-gray-100 shadow-sm" style={getSecStyle(layout, "header", 0)}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {site.logoUrl ? (
              <img src={site.logoUrl} alt="logo" className="h-10 w-10 rounded-lg object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white text-lg" style={{ backgroundColor: primary }}>
                {site.name[0]}
              </div>
            )}
            <span className="text-xl font-bold text-gray-900">{site.name}</span>
          </div>
          <nav className="hidden md:flex gap-6 text-sm text-gray-600 font-medium">
            <a href="#servicios" className="hover:text-gray-900 transition-colors">Servicios</a>
            <a href="#contacto" className="hover:text-gray-900 transition-colors">Contacto</a>
          </nav>
        </div>
      </header>

      <section className="relative py-24 text-center px-6 overflow-hidden" style={getSecStyle(layout, "hero", 1)}>
        {heroData.bgImage
          ? <><img src={heroData.bgImage} alt="hero" className="absolute inset-0 w-full h-full object-cover" /><div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${(heroData.overlay ?? 40) / 100})` }} /></>
          : <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${primary}10, ${primary}05)` }} />}
        <div className="relative z-10 max-w-3xl mx-auto">
          <h1 className={`text-5xl font-extrabold mb-4 ${heroData.bgImage ? "text-white" : "text-gray-900"}`}>{heroData.title || site.name}</h1>
          <p className={`text-xl ${heroData.bgImage ? "text-white/80" : "text-gray-500"}`}>{heroData.subtitle || site.description || "Bienvenido a nuestro sitio web."}</p>
          <div className="mt-8 flex gap-3 justify-center flex-wrap">
            {(heroData.ctaText || heroData.ctaUrl) && (
              <a href={heroData.ctaUrl || "#servicios"}
                className="px-6 py-3 rounded-xl text-white font-semibold transition-opacity hover:opacity-90"
                style={{ backgroundColor: primary }}>
                {heroData.ctaText}
              </a>
            )}
            {!heroData.ctaText && site.phone && (
              <a href={`tel:${site.phone}`}
                className="px-6 py-3 rounded-xl text-white font-semibold transition-opacity hover:opacity-90"
                style={{ backgroundColor: primary }}>
                {site.phone}
              </a>
            )}
            {!heroData.ctaText && site.email && (
              <a href={`mailto:${site.email}`}
                className="px-6 py-3 rounded-xl border-2 font-semibold transition-colors hover:bg-gray-50"
                style={{ borderColor: primary, color: primary }}>
                {site.email}
              </a>
            )}
          </div>
        </div>
      </section>

      <div style={getSecStyle(layout, "services", 2)}>
      {site.services.length > 0 && (
        <section id="servicios" className="py-16 bg-white">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-10 text-gray-900">Servicios</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {site.services.map((s) => (
                <div key={s.id} className="border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                  {s.imageUrl
                    ? <img src={s.imageUrl} alt={s.name} className="w-full h-40 object-cover" />
                    : null}
                  <div className="p-6">
                  {!s.imageUrl && (
                    <div className="w-10 h-10 rounded-lg mb-4 flex items-center justify-center text-white font-bold" style={{ backgroundColor: primary }}>✓</div>
                  )}
                  <h3 className="font-bold text-gray-900 mb-2">{s.name}</h3>
                  {s.description && <p className="text-gray-500 text-sm">{s.description}</p>}
                  {s.price != null && (
                    <p className="mt-4 font-bold" style={{ color: primary }}>${s.price.toFixed(2)}</p>
                  )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      </div>

      <div style={getSecStyle(layout, "booking", 3)}>
        {appointmentsEnabled && (
          <BookingSection
            slug={site.slug}
            siteName={site.name}
            primaryColor={primary}
            secondaryColor={site.secondaryColor}
            services={site.services}
          />
        )}
      </div>

      <section id="contacto" className="py-16 bg-gray-50" style={getSecStyle(layout, "contact", 4)}>
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-8 text-gray-900">Contacto</h2>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            {site.phone && <div className="bg-white rounded-xl border border-gray-100 px-8 py-5"><p className="text-xs text-gray-400 mb-1">Telefono</p><p className="font-semibold text-gray-900">{site.phone}</p></div>}
            {site.address && <div className="bg-white rounded-xl border border-gray-100 px-8 py-5"><p className="text-xs text-gray-400 mb-1">Direccion</p><p className="font-semibold text-gray-900">{site.address}</p></div>}
            {site.email && <div className="bg-white rounded-xl border border-gray-100 px-8 py-5"><p className="text-xs text-gray-400 mb-1">Email</p><p className="font-semibold text-gray-900">{site.email}</p></div>}
          </div>
        </div>
      </section>

      <div style={getSecStyle(layout, "blocks", 5)}>{children}</div>
      <footer className="bg-gray-900 text-white py-8 text-center text-sm" style={getSecStyle(layout, "footer", 6)}>
        &copy; {new Date().getFullYear()} {site.name}
      </footer>
    </div>
  );
}
