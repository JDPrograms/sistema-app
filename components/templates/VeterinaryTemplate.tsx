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

export default function VeterinaryTemplate({ site, appointmentsEnabled = true, children, layoutConfig }: TemplateProps) {
  const primary = site.primaryColor || "#0d9488";
  const secondary = site.secondaryColor || "#f0fdfa";
  const activeStaff = site.staff.filter((s) => s.isActive);
  const layout = parseLayoutConfig(layoutConfig);

  return (
    <div className="min-h-screen font-sans bg-white flex flex-col">

      {/* Header */}
      <header className="bg-white border-b border-teal-100 sticky top-0 z-40 shadow-sm" style={getSecStyle(layout, "header", 0)}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {site.logoUrl ? (
              <img src={site.logoUrl} alt="logo" className="h-11 w-11 rounded-full object-cover border-2" style={{ borderColor: primary }} />
            ) : (
              <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-lg text-white" style={{ backgroundColor: primary }}>
                {site.name[0]}
              </div>
            )}
            <div>
              <p className="font-bold text-lg leading-tight text-gray-900">{site.name}</p>
              <p className="text-xs" style={{ color: primary }}>Clinica Veterinaria</p>
            </div>
          </div>
          <nav className="hidden md:flex gap-7 text-sm font-medium text-gray-600">
            <a href="#servicios" className="hover:text-teal-600 transition-colors">Servicios</a>
            <a href="#equipo" className="hover:text-teal-600 transition-colors">Nuestro Equipo</a>
            <a href="#contacto" className="hover:text-teal-600 transition-colors">Contacto</a>
          </nav>
          <div className="md:hidden">
            <span className="text-2xl">🐾</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section style={{ background: `linear-gradient(135deg, ${primary} 0%, #0f766e 60%, #115e59 100%)`, ...getSecStyle(layout, "hero", 1) }} className="text-white py-24">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-5">
              <span>🐾</span>
              <span>Cuidado profesional para tus mascotas</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
              El bienestar de tu mascota<br />es nuestra prioridad
            </h1>
            <p className="text-lg opacity-85 max-w-lg mb-8">
              {site.description || "Brindamos atencion veterinaria de calidad con amor y dedicacion. Tu mascota merece lo mejor."}
            </p>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              {site.phone && (
                <a href={`tel:${site.phone}`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-all hover:scale-105 shadow-md"
                  style={{ backgroundColor: "white", color: primary }}>
                  📞 Llamar ahora
                </a>
              )}
              <a href="#servicios"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm border-2 border-white/60 hover:bg-white/10 transition-colors">
                Ver servicios
              </a>
            </div>
          </div>
          <div className="text-8xl md:text-9xl select-none opacity-80">🐶</div>
        </div>
      </section>

      {/* Services */}
      <section id="servicios" className="py-16 bg-white" style={getSecStyle(layout, "services", 2)}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1 rounded-full text-sm font-semibold mb-3" style={{ backgroundColor: `${primary}15`, color: primary }}>
              Lo que ofrecemos
            </span>
            <h2 className="text-3xl font-bold text-gray-900">Nuestros Servicios</h2>
            <p className="text-gray-500 mt-2">Atencion integral para cada etapa de la vida de tu mascota</p>
          </div>
          {site.services.length === 0 ? (
            <div className="text-center py-16 rounded-2xl" style={{ backgroundColor: `${primary}08` }}>
              <span className="text-5xl block mb-3">🐾</span>
              <p className="text-gray-400">Los servicios estaran disponibles pronto.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {site.services.map((s) => (
                <div key={s.id} className="bg-white rounded-2xl border border-teal-100 p-6 shadow-sm hover:shadow-md transition-shadow group">
                  {s.imageUrl ? (
                    <img src={s.imageUrl} alt={s.name} className="w-full h-40 object-cover rounded-xl mb-4" />
                  ) : (
                    <div className="w-full h-40 rounded-xl flex items-center justify-center text-5xl mb-4" style={{ backgroundColor: `${primary}12` }}>
                      🐾
                    </div>
                  )}
                  <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-teal-700 transition-colors">{s.name}</h3>
                  {s.description && <p className="text-gray-500 text-sm mb-4 line-clamp-3">{s.description}</p>}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    {s.price != null ? (
                      <span className="font-bold text-xl" style={{ color: primary }}>${s.price.toFixed(2)}</span>
                    ) : (
                      <span className="text-sm text-gray-400">Consultar precio</span>
                    )}
                    {s.duration != null && (
                      <span className="text-xs bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full font-medium">{s.duration} min</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Staff */}
      <section id="equipo" style={{ backgroundColor: `${primary}08`, ...getSecStyle(layout, "staff", 3) }} className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1 rounded-full text-sm font-semibold mb-3" style={{ backgroundColor: `${primary}15`, color: primary }}>
              Profesionales
            </span>
            <h2 className="text-3xl font-bold text-gray-900">Nuestro Equipo</h2>
            <p className="text-gray-500 mt-2">Veterinarios apasionados y altamente capacitados</p>
          </div>
          {activeStaff.length === 0 ? (
            <p className="text-center text-gray-400 py-8">Informacion del equipo disponible pronto.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {activeStaff.map((member) => (
                <div key={member.id} className="bg-white rounded-2xl p-6 text-center shadow-sm border border-teal-100">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4" style={{ backgroundColor: primary }}>
                    {member.name[0]}
                  </div>
                  <h3 className="font-bold text-gray-900">{member.name}</h3>
                  {member.specialty && (
                    <p className="text-sm mt-1" style={{ color: primary }}>{member.specialty}</p>
                  )}
                  <div className="mt-3 inline-flex items-center gap-1 text-xs text-teal-600 bg-teal-50 px-3 py-1 rounded-full">
                    <span>●</span> Activo
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Booking */}
      <div id="citas" style={getSecStyle(layout, "booking", 4)}>
        {appointmentsEnabled && (
          <>
            <div className="text-center pt-12 pb-2">
              <h2 className="text-3xl font-bold text-gray-900">Pedir Turno</h2>
              <p className="text-gray-500 mt-2">Reserva una cita para tu mascota en minutos</p>
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
      <section id="contacto" style={{ backgroundColor: `${primary}10`, ...getSecStyle(layout, "contact", 5) }} className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900">Contacto</h2>
            <p className="text-gray-500 mt-2">Estamos aqui para ayudarte</p>
          </div>
          <div className="flex flex-col md:flex-row gap-5 justify-center flex-wrap">
            {site.phone && (
              <a href={`tel:${site.phone}`} className="bg-white rounded-2xl px-8 py-6 shadow-sm border border-teal-100 text-center hover:shadow-md transition-shadow">
                <div className="text-3xl mb-2">📞</div>
                <p className="text-xs text-gray-400 mb-1">Telefono</p>
                <p className="font-semibold text-gray-900">{site.phone}</p>
              </a>
            )}
            {site.address && (
              <div className="bg-white rounded-2xl px-8 py-6 shadow-sm border border-teal-100 text-center">
                <div className="text-3xl mb-2">📍</div>
                <p className="text-xs text-gray-400 mb-1">Direccion</p>
                <p className="font-semibold text-gray-900">{site.address}</p>
              </div>
            )}
            {site.email && (
              <a href={`mailto:${site.email}`} className="bg-white rounded-2xl px-8 py-6 shadow-sm border border-teal-100 text-center hover:shadow-md transition-shadow">
                <div className="text-3xl mb-2">✉️</div>
                <p className="text-xs text-gray-400 mb-1">Email</p>
                <p className="font-semibold text-gray-900">{site.email}</p>
              </a>
            )}
            {site.whatsapp && (
              <a href={`https://wa.me/${site.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                className="bg-green-500 text-white rounded-2xl px-8 py-6 shadow-sm text-center hover:bg-green-600 transition-colors">
                <div className="text-3xl mb-2">📱</div>
                <p className="text-xs opacity-80 mb-1">WhatsApp</p>
                <p className="font-semibold">{site.whatsapp}</p>
              </a>
            )}
          </div>
        </div>
      </section>

      <div style={getSecStyle(layout, "blocks", 6)}>{children}</div>
      {/* Footer */}
      <footer style={{ backgroundColor: primary, ...getSecStyle(layout, "footer", 7) }} className="text-white py-8 text-center">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-xl">🐾</span>
            <span className="font-bold text-lg">{site.name}</span>
          </div>
          <p className="text-sm opacity-70">&copy; {new Date().getFullYear()} {site.name}. Todos los derechos reservados.</p>
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
