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

export default function SalonTemplate({ site, appointmentsEnabled = true, children, layoutConfig }: TemplateProps) {
  const primary = site.primaryColor || "#ec4899";
  const secondary = site.secondaryColor || "#f9a8d4";
  const activeStaff = site.staff.filter((s) => s.isActive);
  const layout = parseLayoutConfig(layoutConfig);

  return (
    <div className="min-h-screen font-sans flex flex-col" style={{ backgroundColor: "#fdf2f8" }}>

      {/* HEADER */}
      <header className="bg-white shadow-sm border-b" style={{ borderColor: `${primary}30`, ...getSecStyle(layout, "header", 0) }}>
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {site.logoUrl ? (
              <img src={site.logoUrl} alt="logo" className="h-12 w-12 rounded-full object-cover border-2" style={{ borderColor: secondary }} />
            ) : (
              <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl text-white" style={{ backgroundColor: primary }}>
                {site.name[0]}
              </div>
            )}
            <div>
              <span className="text-2xl font-bold tracking-tight" style={{ color: primary }}>{site.name}</span>
              <p className="text-xs text-gray-400 leading-none">Salon & Spa</p>
            </div>
          </div>
          <nav className="hidden md:flex gap-8 text-sm font-medium text-gray-500">
            <a href="#servicios" className="hover:text-gray-800 transition-colors">Servicios</a>
            <a href="#equipo" className="hover:text-gray-800 transition-colors">Equipo</a>
            <a href="#contacto" className="hover:text-gray-800 transition-colors">Contacto</a>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section
        className="py-28 text-center relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, #fce7f3 0%, #fdf2f8 50%, #fce7f3 100%)`, ...getSecStyle(layout, "hero", 1) }}
      >
        {/* Decorative circles */}
        <div className="absolute top-8 left-8 w-32 h-32 rounded-full opacity-20" style={{ backgroundColor: secondary }} />
        <div className="absolute bottom-8 right-8 w-48 h-48 rounded-full opacity-10" style={{ backgroundColor: primary }} />

        <div className="relative max-w-3xl mx-auto px-6">
          <div className="text-4xl mb-4">✨</div>
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-4" style={{ color: "#2d1b2e" }}>
            {site.name}
          </h1>
          <p className="text-lg text-gray-500 mb-8 max-w-xl mx-auto leading-relaxed">
            {site.description || "Belleza, cuidado y bienestar en un espacio diseñado para ti."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {site.phone && (
              <a
                href={`tel:${site.phone}`}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-white font-semibold text-sm transition-opacity hover:opacity-85"
                style={{ backgroundColor: primary }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                Llamar para reservar
              </a>
            )}
            <a
              href="#servicios"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-semibold text-sm border-2 transition-colors hover:bg-pink-50"
              style={{ borderColor: primary, color: primary }}
            >
              Ver servicios
            </a>
          </div>
        </div>
      </section>

      {/* NUESTROS SERVICIOS */}
      <section id="servicios" className="py-20 max-w-6xl mx-auto px-6" style={getSecStyle(layout, "services", 2)}>
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold mb-2" style={{ color: "#2d1b2e" }}>Nuestros Servicios</h2>
          <p className="text-gray-500">Tratamientos exclusivos para tu belleza y bienestar</p>
          <div className="w-16 h-0.5 mx-auto mt-4" style={{ backgroundColor: primary }} />
        </div>

        {site.services.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border" style={{ borderColor: `${primary}30` }}>
            <p className="text-4xl mb-3">💆</p>
            <p className="text-gray-500">Servicios disponibles pronto</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {site.services.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-3xl overflow-hidden border hover:shadow-lg transition-shadow"
                style={{ borderColor: `${primary}20` }}
              >
                {s.imageUrl ? (
                  <img src={s.imageUrl} alt={s.name} className="w-full h-48 object-cover" />
                ) : (
                  <div className="w-full h-32 flex items-center justify-center text-5xl" style={{ backgroundColor: `${primary}10` }}>
                    💆
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{s.name}</h3>
                  {s.description && <p className="text-sm text-gray-500 leading-relaxed mb-4">{s.description}</p>}
                  <div className="flex items-center gap-2 flex-wrap">
                    {s.price != null && (
                      <span className="text-sm font-bold px-3 py-1 rounded-full text-white" style={{ backgroundColor: primary }}>
                        ${s.price.toFixed(2)}
                      </span>
                    )}
                    {s.duration != null && (
                      <span className="text-sm px-3 py-1 rounded-full border font-medium" style={{ borderColor: `${primary}40`, color: primary }}>
                        {s.duration} min
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* EQUIPO */}
      <div style={getSecStyle(layout, "team", 3)}>
      {activeStaff.length > 0 && (
        <section id="equipo" className="py-20" style={{ backgroundColor: "#fce7f3" }}>
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold mb-2" style={{ color: "#2d1b2e" }}>Nuestro Equipo</h2>
              <p className="text-gray-500">Artistas dedicados a realzar tu belleza</p>
              <div className="w-16 h-0.5 mx-auto mt-4" style={{ backgroundColor: primary }} />
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              {activeStaff.map((stylist) => (
                <div
                  key={stylist.id}
                  className="bg-white rounded-3xl px-8 py-6 text-center border min-w-[160px]"
                  style={{ borderColor: `${primary}25` }}
                >
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4"
                    style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
                  >
                    {stylist.name[0].toUpperCase()}
                  </div>
                  <h3 className="font-bold text-gray-900">{stylist.name}</h3>
                  {stylist.specialty && (
                    <p className="text-xs mt-1" style={{ color: primary }}>{stylist.specialty}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      </div>

      {/* BOOKING */}
      <div style={getSecStyle(layout, "booking", 4)}>
        {appointmentsEnabled && (
          <BookingSection
            slug={site.slug}
            siteName={site.name}
            primaryColor={primary}
            secondaryColor={secondary}
            services={site.services}
          />
        )}
      </div>

      {/* CONTACTO */}
      <section id="contacto" className="py-20 bg-white" style={getSecStyle(layout, "contact", 5)}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2" style={{ color: "#2d1b2e" }}>Visitanos</h2>
            <p className="text-gray-500">Estamos esperandote</p>
          </div>
          <div
            className="rounded-3xl p-8 border-2"
            style={{ borderColor: `${primary}30`, background: `linear-gradient(135deg, #fdf2f8, white)` }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              {site.phone && (
                <a href={`tel:${site.phone}`} className="group">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 transition-colors group-hover:opacity-80" style={{ backgroundColor: `${primary}15` }}>
                    <svg className="w-6 h-6" style={{ color: primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  </div>
                  <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Telefono</p>
                  <p className="font-semibold text-gray-800">{site.phone}</p>
                </a>
              )}
              {site.address && (
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: `${primary}15` }}>
                    <svg className="w-6 h-6" style={{ color: primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                  <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Direccion</p>
                  <p className="font-semibold text-gray-800">{site.address}</p>
                </div>
              )}
              {site.email && (
                <a href={`mailto:${site.email}`} className="group text-center">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 transition-colors group-hover:opacity-80" style={{ backgroundColor: `${primary}15` }}>
                    <svg className="w-6 h-6" style={{ color: primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Email</p>
                  <p className="font-semibold text-gray-800">{site.email}</p>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <div style={getSecStyle(layout, "blocks", 6)}>{children}</div>
      {/* FOOTER */}
      <footer className="py-8 text-center border-t" style={{ borderColor: `${primary}20`, backgroundColor: "#fdf2f8", ...getSecStyle(layout, "footer", 7) }}>
        <p className="font-semibold mb-1" style={{ color: primary }}>{site.name}</p>
        <p className="text-sm text-gray-400">&copy; {new Date().getFullYear()} Todos los derechos reservados.</p>
      </footer>

      {/* WHATSAPP BUBBLE */}
      {site.whatsapp && (
        <a
          href={"https://wa.me/" + site.whatsapp.replace(/\D/g, "")}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-400 rounded-full flex items-center justify-center shadow-lg transition-colors"
          aria-label="WhatsApp"
        >
          <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </a>
      )}
    </div>
  );
}
