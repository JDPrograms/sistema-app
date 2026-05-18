import BookingSection from "@/components/booking/BookingSection";
import { parseLayoutConfig, getSecStyle } from "@/lib/layout-config";

interface Product { id: string; name: string; description?: string | null; price?: number | null; comparePrice?: number | null; stock?: number | null; imageUrl?: string | null; featured?: boolean; category?: string | null; }
interface Service { id: string; name: string; price?: number | null; }
interface Site {
  name: string; slug: string; description?: string; phone?: string;
  address?: string; email?: string; primaryColor: string; secondaryColor: string;
  logoUrl?: string; whatsapp?: string; socialLinks?: string;
  services: Service[]; products: Product[];
}

export default function StoreTemplate({ site, appointmentsEnabled = true, children, layoutConfig }: { site: Site; appointmentsEnabled?: boolean; children?: React.ReactNode; layoutConfig?: string | null }) {
  const primary = site.primaryColor || "#1d4ed8";
  const secondary = site.secondaryColor || "#fbbf24";
  const layout = parseLayoutConfig(layoutConfig);
  const heroData = (layout as any).heroData || {};

  return (
    <div className="min-h-screen font-sans flex flex-col bg-gray-50">
      {/* TOP BAR */}
      <div className="text-white text-xs py-2 px-6 flex items-center justify-between" style={{ backgroundColor: primary }}>
        <span>🛒 Tienda Online & Local</span>
        {site.phone && <span>📞 {site.phone}</span>}
      </div>

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-100" style={getSecStyle(layout, "header", 0)}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-shrink-0">
            {site.logoUrl
              ? <img src={site.logoUrl} alt="logo" className="h-10 w-auto object-contain" />
              : <span className="text-xl font-black" style={{ color: primary }}>{site.name}</span>}
          </div>
          <nav className="hidden md:flex gap-6 text-sm font-semibold text-gray-600">
            <a href="#productos" className="hover:text-gray-900 transition-colors">Productos</a>
            <a href="#categorias" className="hover:text-gray-900 transition-colors">Categorías</a>
            <a href="#ofertas" className="hover:text-gray-900 transition-colors">Ofertas</a>
            <a href="#contacto" className="hover:text-gray-900 transition-colors">Contacto</a>
          </nav>
          {site.whatsapp && (
            <a href={`https://wa.me/${site.whatsapp.replace(/\D/g, "")}`}
              className="hidden md:inline-flex items-center gap-2 px-5 py-2 rounded-lg text-white text-sm font-bold hover:opacity-90 transition-opacity"
              style={{ backgroundColor: primary }}>
              💬 Pedir Ahora
            </a>
          )}
        </div>
      </header>

      {/* HERO BANNER */}
      <section className="relative overflow-hidden" style={getSecStyle(layout, "hero", 1)}>
        {heroData.bgImage && (
          <>
            <img src={heroData.bgImage} alt="hero" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50" />
          </>
        )}
        {!heroData.bgImage && (
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${primary} 0%, #1e3a8a 100%)` }} />
        )}
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-white max-w-xl">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-4" style={{ backgroundColor: secondary, color: "#111" }}>
              🔥 Ofertas de la Semana
            </span>
            <h1 className="text-5xl md:text-6xl font-black leading-tight mb-5">{heroData.title || site.name}</h1>
            <p className="text-lg text-white/80 mb-8">
              {heroData.subtitle || site.description || "Todo lo que necesitas en un solo lugar. Calidad y precio insuperables."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href={heroData.ctaUrl || "#productos"}
                className="inline-block px-8 py-4 rounded-xl font-bold text-gray-900 text-lg shadow-lg hover:scale-105 transition-transform text-center"
                style={{ backgroundColor: secondary }}>
                {heroData.ctaText || "Comprar Ahora"}
              </a>
              <a href="#categorias"
                className="inline-block px-8 py-4 rounded-xl font-bold text-white text-lg border-2 border-white/30 hover:border-white/60 transition-colors text-center">
                Ver Categorías
              </a>
            </div>
          </div>
          <div className="hidden md:flex gap-4">
            {[
              { icon: "🚀", label: "Envío Rápido" },
              { icon: "💯", label: "Garantía Total" },
              { icon: "💳", label: "Pago Fácil" },
            ].map((item, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-white text-center border border-white/20 w-28">
                <div className="text-3xl mb-2">{item.icon}</div>
                <p className="text-xs font-semibold">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCTS GRID */}
      {(site.products?.length > 0 || site.services.length > 0) && (
        <section id="productos" className="py-20 bg-white" style={getSecStyle(layout, "products", 2)}>
          <div className="max-w-7xl mx-auto px-6">
            {(() => {
              const items = site.products?.length > 0 ? site.products : site.services.map((s) => ({ ...s, imageUrl: null as string | null, comparePrice: null, stock: null, featured: false, category: null }));
              return (
                <>
                  <div className="flex items-center justify-between mb-10">
                    <div>
                      <h2 className="text-3xl font-black text-gray-900">Nuestros Productos</h2>
                      <p className="text-gray-500 mt-1">La mejor selección al mejor precio</p>
                    </div>
                    <span className="text-sm text-gray-400">{items.length} productos</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {items.map((p) => (
                      <div key={p.id} className={`bg-white rounded-2xl overflow-hidden border hover:shadow-lg transition-all duration-200 group cursor-pointer ${(p as Product).featured ? "border-amber-200 ring-1 ring-amber-100" : "border-gray-100"}`}>
                        {p.imageUrl
                          ? <div className="overflow-hidden h-40"><img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" /></div>
                          : <div className="h-40 flex items-center justify-center text-4xl" style={{ backgroundColor: `${primary}08` }}>📦</div>}
                        <div className="p-4">
                          <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-2 leading-tight">{p.name}</h3>
                          {(p as Product).category && <p className="text-xs text-gray-400 mb-1">{(p as Product).category}</p>}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {p.price != null
                              ? <p className="font-black text-base" style={{ color: primary }}>${p.price.toFixed(2)}</p>
                              : <span className="text-xs text-gray-400">Consultar precio</span>}
                            {(p as Product).comparePrice != null && p.price != null && (p as Product).comparePrice! > p.price && (
                              <span className="text-xs text-gray-400 line-through">${(p as Product).comparePrice!.toFixed(2)}</span>
                            )}
                          </div>
                          {(p as Product).stock === 0 && (
                            <span className="text-xs text-red-500 font-semibold mt-1 block">Sin stock</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        </section>
      )}

      {/* FEATURES / WHY US */}
      <section id="ofertas" className="py-16 bg-gray-50" style={getSecStyle(layout, "features", 3)}>
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-black text-gray-900 text-center mb-12">¿Por qué comprar con nosotros?</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { icon: "🚚", title: "Entrega a Domicilio", desc: "Llevamos tu pedido donde estés." },
              { icon: "🔒", title: "Compra Segura", desc: "Pagos protegidos y garantizados." },
              { icon: "♻️", title: "Devoluciones", desc: "30 días para cambios sin preguntas." },
              { icon: "⭐", title: "Productos Originales", desc: "Solo artículos 100% auténticos." },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">{item.title}</h3>
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
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-black text-gray-900 text-center mb-10">Contáctenos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {site.phone && (
              <a href={`tel:${site.phone}`} className="flex flex-col items-center text-center p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors">
                <span className="text-3xl mb-3">📞</span>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Llámanos</p>
                <p className="font-bold text-gray-900">{site.phone}</p>
              </a>
            )}
            {site.whatsapp && (
              <a href={`https://wa.me/${site.whatsapp.replace(/\D/g, "")}`} className="flex flex-col items-center text-center p-6 rounded-2xl text-white hover:opacity-90 transition-opacity" style={{ backgroundColor: "#25D366" }}>
                <span className="text-3xl mb-3">💬</span>
                <p className="text-xs text-white/70 uppercase tracking-wide mb-1">WhatsApp</p>
                <p className="font-bold">{site.whatsapp}</p>
              </a>
            )}
            {site.address && (
              <div className="flex flex-col items-center text-center p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-3xl mb-3">📍</span>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Visítanos</p>
                <p className="font-bold text-gray-900">{site.address}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <div style={getSecStyle(layout, "blocks", 6)}>{children}</div>
      <footer className="py-6 text-center text-white text-sm" style={{ backgroundColor: primary, ...getSecStyle(layout, "footer", 7) }}>
        &copy; {new Date().getFullYear()} {site.name} — Todos los derechos reservados
      </footer>
    </div>
  );
}
