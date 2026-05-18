import BookingSection from "@/components/booking/BookingSection";
import { parseLayoutConfig, getSecStyle } from "@/lib/layout-config";

interface Service { id: string; name: string; description?: string | null; price?: number | null; duration?: number | null; imageUrl?: string | null; }
interface Site {
  name: string; slug: string; description?: string; phone?: string;
  address?: string; email?: string; primaryColor: string; secondaryColor: string;
  logoUrl?: string; whatsapp?: string; socialLinks?: string;
  services: Service[];
}

export default function PhotographerTemplate({ site, appointmentsEnabled = true, children, layoutConfig }: { site: Site; appointmentsEnabled?: boolean; children?: React.ReactNode; layoutConfig?: string | null }) {
  const primary = site.primaryColor || "#1a1a1a";
  const secondary = site.secondaryColor || "#c9a96e";
  const layout = parseLayoutConfig(layoutConfig);
  const heroData = (layout as any).heroData || {};

  return (
    <div className="min-h-screen font-sans flex flex-col bg-black text-white">
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/10" style={getSecStyle(layout, "header", 0)}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {site.logoUrl
              ? <img src={site.logoUrl} alt="logo" className="h-10 w-10 rounded-full object-cover" />
              : <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg" style={{ backgroundColor: secondary, color: "#000" }}>{site.name[0]}</div>}
            <span className="text-lg font-bold tracking-tight">{site.name}</span>
          </div>
          <nav className="hidden md:flex gap-6 text-sm text-white/70 font-medium">
            <a href="#portafolio" className="hover:text-white transition-colors">Portafolio</a>
            <a href="#servicios" className="hover:text-white transition-colors">Servicios</a>
            <a href="#contacto" className="hover:text-white transition-colors">Contacto</a>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden" style={getSecStyle(layout, "hero", 1)}>
        {heroData.bgImage && (
          <>
            <img src={heroData.bgImage} alt="hero" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60" />
          </>
        )}
        {!heroData.bgImage && (
          <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at center, ${primary}40 0%, #000 70%)` }} />
        )}
        <div className={`relative z-10 max-w-4xl mx-auto px-6 text-center`}>
          <p className="text-sm font-semibold tracking-widest uppercase mb-4 opacity-70" style={{ color: secondary }}>Photography</p>
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-none">{heroData.title || site.name}</h1>
          <p className="text-xl opacity-70 max-w-xl mx-auto mb-8">{heroData.subtitle || site.description || "Capturando momentos que perduran para siempre."}</p>
          <a href={heroData.ctaUrl || "#portafolio"}
            className="inline-block px-8 py-3 rounded-full font-semibold text-black transition-opacity hover:opacity-90"
            style={{ backgroundColor: secondary }}>
            {heroData.ctaText || "Ver portafolio"}
          </a>
        </div>
      </section>

      {/* PORTFOLIO GRID (services used as portfolio items) */}
      {site.services.length > 0 && (
        <section id="portafolio" className="py-20 bg-black" style={getSecStyle(layout, "portfolio", 2)}>
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-12">Portafolio</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {site.services.map((s) => (
                <div key={s.id} className="relative group rounded-xl overflow-hidden aspect-square bg-gray-900">
                  {s.imageUrl
                    ? <img src={s.imageUrl} alt={s.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    : <div className="w-full h-full flex items-center justify-center text-4xl" style={{ backgroundColor: `${primary}30` }}>📷</div>}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <div>
                      <p className="font-bold text-white">{s.name}</p>
                      {s.price != null && <p className="text-sm" style={{ color: secondary }}>${s.price.toFixed(2)}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SERVICES */}
      <section id="servicios" className="py-20 bg-gray-950" style={getSecStyle(layout, "services", 3)}>
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Servicios y Paquetes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {site.services.map((s) => (
              <div key={s.id} className="border border-white/10 rounded-2xl p-6 hover:border-white/30 transition-colors">
                <p className="font-bold text-lg mb-2">{s.name}</p>
                {s.description && <p className="text-white/60 text-sm mb-4">{s.description}</p>}
                {s.price != null && <p className="text-2xl font-extrabold" style={{ color: secondary }}>${s.price.toFixed(2)}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BOOKING */}
      {appointmentsEnabled && (
        <div id="reservas" style={getSecStyle(layout, "booking", 4)}>
          <BookingSection slug={site.slug} siteName={site.name} primaryColor={primary} secondaryColor={secondary} services={site.services} />
        </div>
      )}

      {/* CONTACT */}
      <section id="contacto" className="py-20 bg-black" style={getSecStyle(layout, "contact", 5)}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-8">Hablemos</h2>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            {site.phone && <a href={`tel:${site.phone}`} className="flex-1 border border-white/10 rounded-xl px-6 py-5 hover:border-white/30 transition-colors"><p className="text-xs text-white/40 mb-1 uppercase tracking-wide">Teléfono</p><p className="font-semibold">{site.phone}</p></a>}
            {site.email && <a href={`mailto:${site.email}`} className="flex-1 border border-white/10 rounded-xl px-6 py-5 hover:border-white/30 transition-colors"><p className="text-xs text-white/40 mb-1 uppercase tracking-wide">Email</p><p className="font-semibold">{site.email}</p></a>}
            {site.whatsapp && <a href={`https://wa.me/${site.whatsapp.replace(/\D/g,"")}`} className="flex-1 border border-white/10 rounded-xl px-6 py-5 hover:border-white/30 transition-colors"><p className="text-xs text-white/40 mb-1 uppercase tracking-wide">WhatsApp</p><p className="font-semibold">{site.whatsapp}</p></a>}
          </div>
        </div>
      </section>

      <div style={getSecStyle(layout, "blocks", 6)}>{children}</div>
      <footer className="py-8 text-center text-white/40 text-sm border-t border-white/10 bg-black" style={getSecStyle(layout, "footer", 7)}>
        &copy; {new Date().getFullYear()} {site.name}
      </footer>
    </div>
  );
}
