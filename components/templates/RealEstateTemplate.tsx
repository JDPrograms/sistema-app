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

const WHY_US = [
  { icon: "🏅", title: "Trayectoria reconocida", desc: "Anos de experiencia posicionandonos como referentes en el mercado inmobiliario local." },
  { icon: "🤝", title: "Asesoria personalizada", desc: "Acompanamos a cada cliente en cada paso del proceso de compra, venta o alquiler." },
  { icon: "🔒", title: "Operaciones seguras", desc: "Respaldamos todas las transacciones con documentacion legal y gestion profesional." },
];

export default function RealEstateTemplate({ site, appointmentsEnabled = true, children, layoutConfig }: TemplateProps) {
  const primary = site.primaryColor || "#2563eb";
  const secondary = site.secondaryColor || "#f59e0b";
  const layout = parseLayoutConfig(layoutConfig);

  return (
    <div className="min-h-screen font-sans bg-white flex flex-col">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm" style={getSecStyle(layout, "header", 0)}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {site.logoUrl ? (
              <img src={site.logoUrl} alt="logo" className="h-10 w-10 rounded object-cover" />
            ) : (
              <div className="w-10 h-10 rounded flex items-center justify-center font-bold text-lg text-white" style={{ backgroundColor: primary }}>
                {site.name[0]}
              </div>
            )}
            <div>
              <p className="font-bold text-gray-900 text-lg leading-tight">{site.name}</p>
              <p className="text-xs text-gray-400">Inmobiliaria</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-gray-600">
            <a href="#propiedades" className="hover:text-gray-900 transition-colors">Propiedades</a>
            <a href="#asesores" className="hover:text-gray-900 transition-colors">Asesores</a>
            <a href="#contacto" className="hover:text-gray-900 transition-colors">Contacto</a>
            {site.phone && (
              <a href={`tel:${site.phone}`}
                className="px-5 py-2 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90 hover:scale-105"
                style={{ backgroundColor: primary }}>
                {site.phone}
              </a>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section style={{ background: `linear-gradient(135deg, ${primary} 0%, #1d4ed8 50%, #1e3a8a 100%)`, ...getSecStyle(layout, "hero", 1) }} className="text-white py-28 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none select-none flex items-center justify-end pr-12">
          <span className="text-[18rem] leading-none">🏘️</span>
        </div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <span>🏠</span> Bienes Raices
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-5">
              Encuentra tu propiedad ideal
            </h1>
            <p className="text-lg opacity-80 mb-10">
              {site.description || "Tu hogar perfecto o la mejor inversion inmobiliaria estan mas cerca de lo que imaginas. Trabajamos para hacerlo realidad."}
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#propiedades"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-sm transition-all hover:scale-105 shadow-lg"
                style={{ backgroundColor: secondary, color: "#1a1a1a" }}>
                Ver propiedades
              </a>
              {site.phone && (
                <a href={`tel:${site.phone}`}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-semibold text-sm border-2 border-white/40 hover:bg-white/10 transition-colors">
                  📞 Hablar con un asesor
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Properties / Products */}
      <section id="propiedades" className="py-20 bg-gray-50" style={getSecStyle(layout, "properties", 2)}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1 rounded-full text-sm font-semibold mb-3" style={{ backgroundColor: `${primary}12`, color: primary }}>
              Catalogo
            </span>
            <h2 className="text-3xl font-bold text-gray-900">Propiedades Disponibles</h2>
            <p className="text-gray-500 mt-2">Opciones seleccionadas para cada necesidad y presupuesto</p>
          </div>
          {site.products.length === 0 ? (
            <div className="text-center py-20 rounded-2xl bg-white border border-gray-200">
              <span className="text-6xl block mb-4">🏠</span>
              <p className="text-gray-400 text-lg">Las propiedades estaran disponibles pronto.</p>
              <p className="text-gray-300 text-sm mt-1">Contactenos para conocer opciones exclusivas.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {site.products.map((p) => (
                <div key={p.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-shadow group">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-52 flex items-center justify-center text-6xl" style={{ backgroundColor: `${primary}10` }}>
                      🏠
                    </div>
                  )}
                  <div className="p-6">
                    {p.category && (
                      <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-3" style={{ backgroundColor: `${secondary}20`, color: "#b45309" }}>
                        {p.category}
                      </span>
                    )}
                    <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-blue-700 transition-colors">{p.name}</h3>
                    {p.description && <p className="text-gray-500 text-sm line-clamp-3 mb-4">{p.description}</p>}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      {p.price != null ? (
                        <span className="font-bold text-2xl" style={{ color: primary }}>
                          ${p.price.toLocaleString("es-AR")}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">Consultar precio</span>
                      )}
                      <a href="#citas"
                        className="text-sm font-semibold px-4 py-2 rounded-full transition-colors"
                        style={{ backgroundColor: `${primary}12`, color: primary }}>
                        Consultar
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Advisors / Staff */}
      <section id="asesores" className="py-20 bg-white" style={getSecStyle(layout, "advisors", 3)}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1 rounded-full text-sm font-semibold mb-3" style={{ backgroundColor: `${primary}12`, color: primary }}>
              El equipo
            </span>
            <h2 className="text-3xl font-bold text-gray-900">Nuestros Asesores</h2>
            <p className="text-gray-500 mt-2">Profesionales capacitados para acompanarte en cada decision</p>
          </div>
          {site.staff.length === 0 ? (
            <p className="text-center text-gray-400 py-8">Informacion de asesores disponible pronto.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {site.staff.map((member) => (
                <div key={member.id} className="rounded-2xl border border-gray-200 p-6 text-center hover:shadow-md transition-shadow bg-white">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4" style={{ backgroundColor: primary }}>
                    {member.name[0]}
                  </div>
                  <h3 className="font-bold text-gray-900">{member.name}</h3>
                  {member.specialty && <p className="text-sm text-gray-500 mt-1">{member.specialty}</p>}
                  {member.isActive ? (
                    <span className="mt-3 inline-block text-xs text-green-700 bg-green-50 px-3 py-1 rounded-full">Disponible</span>
                  ) : (
                    <span className="mt-3 inline-block text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">No disponible</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Why Us */}
      <section className="py-20 bg-gray-50" style={getSecStyle(layout, "services", 4)}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900">Por que trabajar con nosotros</h2>
            <p className="text-gray-500 mt-2 max-w-lg mx-auto">Nos diferenciamos por la calidad de nuestro servicio y compromiso con cada cliente</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {WHY_US.map((item) => (
              <div key={item.title} className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="text-5xl mb-4">{item.icon}</div>
                <h3 className="font-bold text-xl text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking */}
      <div id="citas" className="bg-white" style={getSecStyle(layout, "booking", 5)}>
        {appointmentsEnabled && (
          <>
            <div className="text-center pt-12 pb-2">
              <h2 className="text-3xl font-bold text-gray-900">Agendar Visita</h2>
              <p className="text-gray-500 mt-2">Coordinamos una visita a la propiedad de tu interes</p>
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
      <section id="contacto" style={{ backgroundColor: primary, ...getSecStyle(layout, "contact", 6) }} className="py-16 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-10">Contacto</h2>
          <div className="flex flex-col md:flex-row gap-5 justify-center flex-wrap">
            {site.phone && (
              <a href={`tel:${site.phone}`} className="bg-white/10 hover:bg-white/20 transition-colors rounded-2xl px-8 py-6 text-center border border-white/10">
                <p className="text-2xl mb-2">📞</p>
                <p className="text-xs opacity-60 mb-1">Telefono</p>
                <p className="font-semibold">{site.phone}</p>
              </a>
            )}
            {site.address && (
              <div className="bg-white/10 rounded-2xl px-8 py-6 text-center border border-white/10">
                <p className="text-2xl mb-2">📍</p>
                <p className="text-xs opacity-60 mb-1">Oficina</p>
                <p className="font-semibold">{site.address}</p>
              </div>
            )}
            {site.email && (
              <a href={`mailto:${site.email}`} className="bg-white/10 hover:bg-white/20 transition-colors rounded-2xl px-8 py-6 text-center border border-white/10">
                <p className="text-2xl mb-2">✉️</p>
                <p className="text-xs opacity-60 mb-1">Email</p>
                <p className="font-semibold">{site.email}</p>
              </a>
            )}
            {site.whatsapp && (
              <a href={`https://wa.me/${site.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                className="bg-green-600 hover:bg-green-700 transition-colors rounded-2xl px-8 py-6 text-center border border-green-500">
                <p className="text-2xl mb-2">📱</p>
                <p className="text-xs opacity-80 mb-1">WhatsApp</p>
                <p className="font-semibold">{site.whatsapp}</p>
              </a>
            )}
          </div>
        </div>
      </section>

      <div style={getSecStyle(layout, "blocks", 7)}>{children}</div>
      {/* Footer */}
      <footer className="py-8 bg-gray-900 text-center" style={getSecStyle(layout, "footer", 8)}>
        <div className="max-w-7xl mx-auto px-6">
          <p className="font-bold text-white mb-1">{site.name}</p>
          <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} {site.name}. Todos los derechos reservados.</p>
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
