import BookingSection from "@/components/booking/BookingSection";
import { parseLayoutConfig, getSecStyle } from "@/lib/layout-config";

interface Service { id: string; name: string; description?: string | null; price?: number | null; duration?: number | null; imageUrl?: string | null; }
interface Product { id: string; name: string; description?: string | null; price?: number | null; stock?: number | null; category?: string | null; imageUrl?: string | null; }
interface Staff { id: string; name: string; specialty?: string | null; isActive: boolean; }
interface SiteData {
  name: string; slug: string; description?: string | null;
  phone?: string | null; address?: string | null; email?: string | null;
  whatsapp?: string | null; primaryColor: string; secondaryColor: string;
  logoUrl?: string | null;
  services: Service[]; products: Product[]; staff: Staff[];
}
interface TemplateProps { site: SiteData; appointmentsEnabled?: boolean; children?: React.ReactNode; layoutConfig?: string | null; }

export default function HotelTemplate({ site, appointmentsEnabled = true, children, layoutConfig }: TemplateProps) {
  const primary = site.primaryColor || "#1e293b";
  const secondary = site.secondaryColor || "#d4a574";
  const activeStaff = site.staff.filter((s) => s.isActive);
  const layout = parseLayoutConfig(layoutConfig);
  const heroData = (layout as any).heroData || {};

  return (
    <div className="min-h-screen font-sans flex flex-col" style={{ backgroundColor: "#faf9f7" }}>

      {/* Header */}
      <header style={{ backgroundColor: primary, ...getSecStyle(layout, "header", 0) }} className="text-white sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {site.logoUrl ? (
              <img src={site.logoUrl} alt="logo" className="h-11 w-11 rounded object-cover border" style={{ borderColor: secondary }} />
            ) : (
              <div className="w-11 h-11 rounded flex items-center justify-center font-bold text-lg" style={{ backgroundColor: secondary, color: primary }}>
                {site.name[0]}
              </div>
            )}
            <div>
              <p className="font-bold text-xl tracking-wide">{site.name}</p>
              <p className="text-xs opacity-60 tracking-widest uppercase">Hotel</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#habitaciones" className="opacity-80 hover:opacity-100 tracking-wide transition-opacity">Habitaciones</a>
            <a href="#servicios" className="opacity-80 hover:opacity-100 tracking-wide transition-opacity">Servicios</a>
            <a href="#citas" className="opacity-80 hover:opacity-100 tracking-wide transition-opacity">Reservar</a>
            <a href="#contacto"
              className="px-5 py-2 rounded text-sm font-semibold transition-all hover:opacity-90"
              style={{ backgroundColor: secondary, color: primary }}>
              Reservar ahora
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative text-white overflow-hidden" style={{ minHeight: "88vh", ...getSecStyle(layout, "hero", 1) }}>
        <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, ${primary} 0%, #0f172a 40%, #1a1a2e 100%)` }} />
        <div className="absolute inset-0 opacity-10 pointer-events-none select-none">
          <div className="w-full h-full flex items-center justify-center text-[30rem] leading-none">🏨</div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 flex flex-col items-center justify-center text-center" style={{ minHeight: "88vh" }}>
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium mb-8 border" style={{ backgroundColor: `${secondary}15`, color: secondary, borderColor: `${secondary}30` }}>
            <span>✨</span> Experiencia de lujo incomparable
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold leading-none mb-6 tracking-tight">
            {site.name}
          </h1>
          <p className="text-lg md:text-xl opacity-70 max-w-2xl mb-10 leading-relaxed">
            {site.description || "Un lugar donde el lujo se encuentra con la comodidad. Disfruta de habitaciones exclusivas y servicios de primer nivel."}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href="#citas"
              className="inline-flex items-center gap-2 px-10 py-4 rounded font-bold text-sm transition-all hover:scale-105 shadow-xl tracking-wide"
              style={{ backgroundColor: secondary, color: primary }}>
              Reservar ahora
            </a>
            <a href="#habitaciones"
              className="inline-flex items-center gap-2 px-10 py-4 rounded font-semibold text-sm border-2 border-white/20 hover:bg-white/10 transition-colors tracking-wide">
              Ver habitaciones
            </a>
          </div>
          {site.address && (
            <p className="mt-10 text-sm opacity-50">📍 {site.address}</p>
          )}
        </div>
      </section>

      {/* Rooms / Products */}
      <section id="habitaciones" style={{ backgroundColor: "#faf9f7", ...getSecStyle(layout, "rooms", 2) }} className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1 text-sm font-semibold mb-3 rounded-full" style={{ backgroundColor: `${secondary}20`, color: "#92400e" }}>
              Alojamiento
            </span>
            <h2 className="text-3xl font-bold text-gray-900">Nuestras Habitaciones</h2>
            <p className="text-gray-500 mt-2 max-w-lg mx-auto">Espacios disenados para tu comodidad y descanso absoluto</p>
          </div>
          {site.products.length === 0 ? (
            <div className="text-center py-20 rounded-2xl bg-white border border-gray-200">
              <span className="text-6xl block mb-4">🛏️</span>
              <p className="text-gray-400 text-lg">Las habitaciones estaran disponibles pronto.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {site.products.map((p) => (
                <div key={p.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow group border border-gray-100">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-56 flex items-center justify-center text-7xl" style={{ background: `linear-gradient(135deg, ${primary}15, ${secondary}15)` }}>
                      🛏️
                    </div>
                  )}
                  <div className="p-6">
                    {p.category && (
                      <span className="text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-3 inline-block" style={{ backgroundColor: `${secondary}18`, color: "#92400e" }}>
                        {p.category}
                      </span>
                    )}
                    <h3 className="font-bold text-xl text-gray-900 mb-2 group-hover:opacity-80 transition-opacity">{p.name}</h3>
                    {p.description && <p className="text-gray-500 text-sm line-clamp-3 mb-4 leading-relaxed">{p.description}</p>}
                    <div className="flex items-end justify-between pt-4 border-t border-gray-100">
                      {p.price != null ? (
                        <div>
                          <span className="text-2xl font-bold" style={{ color: primary }}>${p.price.toLocaleString("es-AR")}</span>
                          <span className="text-xs text-gray-400 ml-1">/ noche</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Consultar tarifa</span>
                      )}
                      <a href="#citas"
                        className="text-sm font-semibold px-4 py-2 rounded transition-colors text-white"
                        style={{ backgroundColor: primary }}>
                        Reservar
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Services & Amenities */}
      <section id="servicios" style={{ backgroundColor: primary, ...getSecStyle(layout, "amenities", 3) }} className="py-20 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1 text-sm font-semibold mb-3 rounded-full" style={{ backgroundColor: `${secondary}20`, color: secondary }}>
              Instalaciones
            </span>
            <h2 className="text-3xl font-bold">Servicios e Instalaciones</h2>
            <p className="opacity-60 mt-2">Todo lo que necesitas para una estadía perfecta</p>
          </div>
          {site.services.length === 0 ? (
            <p className="text-center opacity-50 py-8">Los servicios estaran disponibles pronto.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
              {site.services.map((s) => (
                <div key={s.id} className="bg-white/8 rounded-xl border border-white/10 hover:bg-white/12 transition-colors overflow-hidden">
                  {s.imageUrl && <img src={s.imageUrl} alt={s.name} className="w-full h-36 object-cover opacity-90" />}
                  <div className="flex items-start gap-4 p-5">
                  {!s.imageUrl && <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: secondary, color: primary }}>✓</div>}
                  <div>
                    <h3 className="font-semibold text-white">{s.name}</h3>
                    {s.description && <p className="text-xs opacity-60 mt-1 leading-relaxed">{s.description}</p>}
                    {s.price != null && (
                      <p className="text-xs mt-1.5 font-medium" style={{ color: secondary }}>${s.price.toFixed(2)}</p>
                    )}
                  </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Staff */}
      <div style={getSecStyle(layout, "extra", 4)}>
      {activeStaff.length > 0 && (
        <section style={{ backgroundColor: "#faf9f7" }} className="py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-14">
              <span className="inline-block px-4 py-1 text-sm font-semibold mb-3 rounded-full" style={{ backgroundColor: `${secondary}20`, color: "#92400e" }}>
                Equipo
              </span>
              <h2 className="text-3xl font-bold text-gray-900">Nuestro Personal</h2>
              <p className="text-gray-500 mt-2">Dedicados a brindarle la mejor experiencia</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {activeStaff.map((member) => (
                <div key={member.id} className="bg-white rounded-2xl p-5 text-center shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white mx-auto mb-3" style={{ backgroundColor: primary }}>
                    {member.name[0]}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">{member.name}</h3>
                  {member.specialty && <p className="text-xs text-gray-400 mt-0.5">{member.specialty}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      </div>

      {/* Booking */}
      <div id="citas" className="bg-white" style={getSecStyle(layout, "booking", 5)}>
        {appointmentsEnabled && (
          <>
            <div className="text-center pt-12 pb-2">
              <h2 className="text-3xl font-bold text-gray-900">Hacer Reserva</h2>
              <p className="text-gray-500 mt-2">Reserva tu estadía de forma rapida y segura</p>
            </div>
            <BookingSection
              slug={site.slug}
              siteName={site.name}
              primaryColor={primary}
              secondaryColor={secondary}
              services={site.services}
            />
          </>
        )}
      </div>

      {/* Contact */}
      <section id="contacto" style={{ backgroundColor: "#faf9f7", ...getSecStyle(layout, "contact", 6) }} className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900">Contacto y Reservas</h2>
            <p className="text-gray-500 mt-2">Nuestro equipo esta disponible las 24 horas</p>
          </div>
          <div className="flex flex-col md:flex-row gap-6 justify-center flex-wrap">
            {site.phone && (
              <a href={`tel:${site.phone}`}
                className="bg-white rounded-2xl px-10 py-7 text-center shadow-sm border border-gray-200 hover:shadow-md transition-shadow min-w-[200px]">
                <p className="text-3xl mb-3">📞</p>
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Telefono</p>
                <p className="font-semibold text-gray-900">{site.phone}</p>
              </a>
            )}
            {site.address && (
              <div className="bg-white rounded-2xl px-10 py-7 text-center shadow-sm border border-gray-200 min-w-[200px]">
                <p className="text-3xl mb-3">📍</p>
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Ubicacion</p>
                <p className="font-semibold text-gray-900">{site.address}</p>
              </div>
            )}
            {site.email && (
              <a href={`mailto:${site.email}`}
                className="bg-white rounded-2xl px-10 py-7 text-center shadow-sm border border-gray-200 hover:shadow-md transition-shadow min-w-[200px]">
                <p className="text-3xl mb-3">✉️</p>
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Email</p>
                <p className="font-semibold text-gray-900">{site.email}</p>
              </a>
            )}
            {site.whatsapp && (
              <a href={`https://wa.me/${site.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                className="bg-green-500 text-white rounded-2xl px-10 py-7 text-center shadow-sm hover:bg-green-600 transition-colors min-w-[200px]">
                <p className="text-3xl mb-3">📱</p>
                <p className="text-xs opacity-80 uppercase tracking-widest mb-1">WhatsApp</p>
                <p className="font-semibold">{site.whatsapp}</p>
              </a>
            )}
          </div>
        </div>
      </section>

      <div style={getSecStyle(layout, "blocks", 7)}>{children}</div>
      {/* Footer */}
      <footer style={{ backgroundColor: "#0f172a", ...getSecStyle(layout, "footer", 8) }} className="text-white py-10 text-center">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="text-2xl">🏨</span>
            <p className="font-bold text-xl tracking-wide">{site.name}</p>
          </div>
          {site.address && <p className="text-sm opacity-40 mb-3">📍 {site.address}</p>}
          <p className="text-sm opacity-40">&copy; {new Date().getFullYear()} {site.name}. Todos los derechos reservados.</p>
        </div>
      </footer>

      {/* WhatsApp Float Button */}
      {site.whatsapp && (
        <a href={`https://wa.me/${site.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
          className="fixed bottom-20 right-4 bg-green-500 hover:bg-green-600 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg z-50 text-xl transition-colors">
          📱
        </a>
      )}
    </div>
  );
}
