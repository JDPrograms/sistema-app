import BookingSection from "@/components/booking/BookingSection";
import { parseLayoutConfig, getSecStyle } from "@/lib/layout-config";

interface Product { id: string; name: string; description?: string | null; price?: number | null; comparePrice?: number | null; stock?: number | null; imageUrl?: string | null; featured?: boolean; category?: string | null; }
interface Service { id: string; name: string; description?: string | null; price?: number | null; imageUrl?: string | null; }
interface Site {
  name: string; slug: string; description?: string; phone?: string;
  address?: string; email?: string; primaryColor: string; secondaryColor: string;
  logoUrl?: string; whatsapp?: string; socialLinks?: string;
  services: Service[]; products: Product[];
}

export default function PharmacyTemplate({ site, appointmentsEnabled = true, children, layoutConfig }: { site: Site; appointmentsEnabled?: boolean; children?: React.ReactNode; layoutConfig?: string | null }) {
  const primary = site.primaryColor || "#0d9488";
  const secondary = site.secondaryColor || "#f0fdf4";
  const layout = parseLayoutConfig(layoutConfig);
  const heroData = (layout as any).heroData || {};

  return (
    <div className="min-h-screen font-sans flex flex-col bg-gray-50">
      {/* TOP BAR */}
      <div className="text-white text-xs py-2 px-6 text-center" style={{ backgroundColor: primary }}>
        {site.address && <span>📍 {site.address}</span>}
        {site.address && site.phone && <span className="mx-3">|</span>}
        {site.phone && <span>📞 {site.phone}</span>}
      </div>

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white shadow-sm" style={getSecStyle(layout, "header", 0)}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {site.logoUrl
              ? <img src={site.logoUrl} alt="logo" className="h-12 w-auto object-contain" />
              : (
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-lg" style={{ backgroundColor: primary }}>+</div>
                  <span className="text-xl font-black" style={{ color: primary }}>{site.name}</span>
                </div>
              )}
          </div>
          <nav className="hidden md:flex gap-8 text-sm font-semibold text-gray-600">
            <a href="#productos" className="hover:text-gray-900 transition-colors">Productos</a>
            <a href="#servicios" className="hover:text-gray-900 transition-colors">Servicios</a>
            <a href="#contacto" className="hover:text-gray-900 transition-colors">Contacto</a>
          </nav>
          {site.whatsapp && (
            <a href={`https://wa.me/${site.whatsapp.replace(/\D/g, "")}`}
              className="hidden md:inline-flex items-center gap-2 px-5 py-2 rounded-lg text-white text-sm font-bold hover:opacity-90 transition-opacity"
              style={{ backgroundColor: primary }}>
              💬 Consultar
            </a>
          )}
        </div>
      </header>

      {/* HERO */}
      <section className="relative py-20 overflow-hidden" style={getSecStyle(layout, "hero", 1)}>
        {heroData.bgImage && (
          <>
            <img src={heroData.bgImage} alt="hero" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-white/75" />
          </>
        )}
        {!heroData.bgImage && (
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${primary}15 0%, ${primary}05 100%)` }} />
        )}
        <div className="relative z-10 max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold mb-6" style={{ backgroundColor: `${primary}15`, color: primary }}>
              🏥 Farmacia & Salud
            </span>
            <h1 className="text-5xl font-black text-gray-900 mb-5 leading-tight">{heroData.title || site.name}</h1>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              {heroData.subtitle || site.description || "Tu salud es nuestra prioridad. Atención farmacéutica de confianza."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href={heroData.ctaUrl || "#productos"}
                className="inline-block px-8 py-3.5 rounded-xl text-white font-bold text-base shadow-md hover:opacity-90 transition-opacity text-center"
                style={{ backgroundColor: primary }}>
                {heroData.ctaText || "Ver Productos"}
              </a>
              {site.whatsapp && (
                <a href={`https://wa.me/${site.whatsapp.replace(/\D/g, "")}`}
                  className="inline-block px-8 py-3.5 rounded-xl font-bold text-base border-2 text-gray-700 hover:border-gray-400 transition-colors text-center"
                  style={{ borderColor: `${primary}40` }}>
                  Consulta Online
                </a>
              )}
            </div>
          </div>
          <div className="hidden md:grid grid-cols-2 gap-4">
            {[
              { icon: "💊", label: "Medicamentos" },
              { icon: "🩺", label: "Salud General" },
              { icon: "💉", label: "Vacunación" },
              { icon: "🌿", label: "Naturales" },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
                <div className="text-3xl mb-2">{item.icon}</div>
                <p className="text-sm font-semibold text-gray-700">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCTS / SERVICES CATALOG */}
      {(site.products?.length > 0 || site.services.length > 0) && (
        <section id="productos" className="py-20 bg-white" style={getSecStyle(layout, "products", 2)}>
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-black text-gray-900 text-center mb-3">Productos y Servicios</h2>
            <p className="text-gray-500 text-center mb-12">Encuentra todo lo que necesitas para tu bienestar</p>
            {(() => {
              const items: Product[] = site.products?.length > 0
                ? site.products
                : site.services.map((s) => ({ ...s, comparePrice: null, stock: null, featured: false, category: null }));
              return (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {items.map((p) => (
                    <div key={p.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow group">
                      {p.imageUrl
                        ? <img src={p.imageUrl} alt={p.name} className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300" />
                        : <div className="w-full h-36 flex items-center justify-center text-4xl" style={{ backgroundColor: `${primary}10` }}>💊</div>}
                      <div className="p-4">
                        <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-2">{p.name}</h3>
                        {p.description && <p className="text-xs text-gray-400 mb-2 line-clamp-2">{p.description}</p>}
                        <div className="flex items-center gap-2 flex-wrap">
                          {p.price != null && (
                            <p className="text-base font-black" style={{ color: primary }}>${p.price.toFixed(2)}</p>
                          )}
                          {p.comparePrice != null && p.price != null && p.comparePrice > p.price && (
                            <span className="text-xs text-gray-400 line-through">${p.comparePrice.toFixed(2)}</span>
                          )}
                        </div>
                        {p.stock === 0 && <span className="text-xs text-red-500 font-semibold mt-1 block">Sin stock</span>}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </section>
      )}

      {/* TRUST BADGES */}
      <section id="servicios" className="py-16 bg-gray-50" style={getSecStyle(layout, "trust", 3)}>
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-black text-gray-900 text-center mb-12">Nuestros Servicios</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: "🩺", title: "Asesoría Farmacéutica", desc: "Orientación profesional sobre medicamentos." },
              { icon: "📋", title: "Recetas Médicas", desc: "Procesamos todas las recetas con rapidez." },
              { icon: "🚚", title: "Entrega a Domicilio", desc: "Pedidos directamente a tu puerta." },
              { icon: "⏰", title: "Horario Extendido", desc: "Disponibles cuando más nos necesitas." },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-gray-900 text-sm mb-2">{item.title}</h3>
                <p className="text-xs text-gray-500">{item.desc}</p>
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
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-black text-gray-900 mb-10">Contáctenos</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {site.phone && (
              <a href={`tel:${site.phone}`} className="flex-1 bg-gray-50 rounded-xl p-5 border border-gray-100 hover:border-gray-200 transition-colors">
                <p className="text-2xl mb-2">📞</p>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Teléfono</p>
                <p className="font-bold text-gray-900">{site.phone}</p>
              </a>
            )}
            {site.email && (
              <a href={`mailto:${site.email}`} className="flex-1 bg-gray-50 rounded-xl p-5 border border-gray-100 hover:border-gray-200 transition-colors">
                <p className="text-2xl mb-2">✉️</p>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Email</p>
                <p className="font-bold text-gray-900">{site.email}</p>
              </a>
            )}
            {site.address && (
              <div className="flex-1 bg-gray-50 rounded-xl p-5 border border-gray-100">
                <p className="text-2xl mb-2">📍</p>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Dirección</p>
                <p className="font-bold text-gray-900">{site.address}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <div style={getSecStyle(layout, "blocks", 6)}>{children}</div>
      <footer className="py-6 text-center text-sm text-white" style={{ backgroundColor: primary, ...getSecStyle(layout, "footer", 7) }}>
        &copy; {new Date().getFullYear()} {site.name} — Tu salud, nuestra misión
      </footer>
    </div>
  );
}
