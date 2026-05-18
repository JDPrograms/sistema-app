import BookingSection from "@/components/booking/BookingSection";
import { parseLayoutConfig, getSecStyle } from "@/lib/layout-config";

interface Service { id: string; name: string; description?: string | null; price?: number | null; duration?: number | null; imageUrl?: string | null; }
interface Site {
  name: string; slug: string; description?: string; phone?: string;
  address?: string; email?: string; primaryColor: string; secondaryColor: string;
  logoUrl?: string; whatsapp?: string; socialLinks?: string;
  services: Service[];
}

export default function CafeteriaTemplate({ site, appointmentsEnabled = true, children, layoutConfig }: { site: Site; appointmentsEnabled?: boolean; children?: React.ReactNode; layoutConfig?: string | null }) {
  const primary = site.primaryColor || "#6b4226";
  const secondary = site.secondaryColor || "#f5c842";
  const layout = parseLayoutConfig(layoutConfig);
  const heroData = (layout as any).heroData || {};

  return (
    <div className="min-h-screen font-sans flex flex-col" style={{ backgroundColor: "#fffbf5" }}>
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-sm" style={getSecStyle(layout, "header", 0)}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {site.logoUrl
              ? <img src={site.logoUrl} alt="logo" className="h-12 w-12 rounded-full object-cover" />
              : <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold" style={{ backgroundColor: primary, color: "#fff" }}>☕</div>}
            <div>
              <span className="text-xl font-bold" style={{ color: primary }}>{site.name}</span>
              {site.address && <p className="text-xs text-gray-500">{site.address}</p>}
            </div>
          </div>
          <nav className="hidden md:flex gap-8 text-sm font-semibold">
            <a href="#menu" className="transition-colors hover:opacity-70" style={{ color: primary }}>Menú</a>
            <a href="#especialidades" className="transition-colors hover:opacity-70" style={{ color: primary }}>Especialidades</a>
            <a href="#contacto" className="transition-colors hover:opacity-70" style={{ color: primary }}>Contacto</a>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="relative flex items-center justify-center min-h-[70vh] overflow-hidden" style={getSecStyle(layout, "hero", 1)}>
        {heroData.bgImage && (
          <>
            <img src={heroData.bgImage} alt="hero" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ backgroundColor: "rgba(107,66,38,0.7)" }} />
          </>
        )}
        {!heroData.bgImage && (
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${primary} 0%, #3b1f0e 100%)` }} />
        )}
        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          <p className="text-sm font-bold tracking-widest uppercase mb-4" style={{ color: secondary }}>☕ Café & Comida</p>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-5 leading-tight">{heroData.title || site.name}</h1>
          <p className="text-xl text-white/80 max-w-xl mx-auto mb-8">{heroData.subtitle || site.description || "Sabores que enamoran, momentos que perduran."}</p>
          <a href={heroData.ctaUrl || "#menu"}
            className="inline-block px-10 py-4 rounded-full font-bold text-gray-900 text-lg shadow-lg hover:scale-105 transition-transform"
            style={{ backgroundColor: secondary }}>
            {heroData.ctaText || "Ver Menú"}
          </a>
        </div>
      </section>

      {/* MENU HIGHLIGHTS */}
      {site.services.length > 0 && (
        <section id="menu" className="py-20 bg-white" style={getSecStyle(layout, "menu", 2)}>
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-4xl font-black text-center mb-3" style={{ color: primary }}>Nuestro Menú</h2>
            <p className="text-center text-gray-500 mb-12">Preparado con los mejores ingredientes</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {site.services.map((s) => (
                <div key={s.id} className="rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow border border-gray-100">
                  {s.imageUrl
                    ? <img src={s.imageUrl} alt={s.name} className="w-full h-48 object-cover" />
                    : <div className="w-full h-48 flex items-center justify-center text-5xl" style={{ backgroundColor: `${primary}15` }}>🍽️</div>}
                  <div className="p-5">
                    <h3 className="font-bold text-lg text-gray-900 mb-2">{s.name}</h3>
                    {s.description && <p className="text-gray-500 text-sm mb-3 line-clamp-2">{s.description}</p>}
                    {s.price != null && (
                      <span className="inline-block px-4 py-1 rounded-full text-white text-sm font-bold" style={{ backgroundColor: primary }}>
                        ${s.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SPECIALTY / ABOUT */}
      <section id="especialidades" className="py-20" style={{ backgroundColor: `${primary}08`, ...getSecStyle(layout, "specialty", 3) }}>
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-black mb-4" style={{ color: primary }}>¿Por qué elegirnos?</h2>
          <p className="text-gray-600 mb-12 max-w-xl mx-auto">Comprometidos con la calidad y el sabor auténtico.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { icon: "🌱", title: "Ingredientes Frescos", desc: "Seleccionamos los mejores productos cada día." },
              { icon: "👨‍🍳", title: "Recetas Artesanales", desc: "Preparadas con amor y técnica tradicional." },
              { icon: "❤️", title: "Ambiente Acogedor", desc: "Un lugar donde te sientes en casa." },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm">{item.desc}</p>
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
      <section id="contacto" className="py-20 bg-white" style={getSecStyle(layout, "contact", 5)}>
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-black mb-10" style={{ color: primary }}>Visítanos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {site.phone && (
              <a href={`tel:${site.phone}`} className="rounded-2xl p-6 border-2 border-gray-100 hover:border-opacity-100 transition-colors" style={{ borderColor: `${primary}30` }}>
                <div className="text-3xl mb-2">📞</div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Teléfono</p>
                <p className="font-bold text-gray-900">{site.phone}</p>
              </a>
            )}
            {site.address && (
              <div className="rounded-2xl p-6 border-2" style={{ borderColor: `${primary}30` }}>
                <div className="text-3xl mb-2">📍</div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Dirección</p>
                <p className="font-bold text-gray-900">{site.address}</p>
              </div>
            )}
            {site.whatsapp && (
              <a href={`https://wa.me/${site.whatsapp.replace(/\D/g, "")}`} className="rounded-2xl p-6 border-2 transition-colors" style={{ borderColor: `${primary}30` }}>
                <div className="text-3xl mb-2">💬</div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">WhatsApp</p>
                <p className="font-bold text-gray-900">{site.whatsapp}</p>
              </a>
            )}
          </div>
        </div>
      </section>

      <div style={getSecStyle(layout, "blocks", 6)}>{children}</div>
      <footer className="py-8 text-center text-sm border-t" style={{ backgroundColor: primary, color: "rgba(255,255,255,0.7)", ...getSecStyle(layout, "footer", 7) }}>
        &copy; {new Date().getFullYear()} {site.name} — Hecho con ☕
      </footer>
    </div>
  );
}
