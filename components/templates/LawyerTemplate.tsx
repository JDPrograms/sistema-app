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

const WHY_CHOOSE = [
  { icon: "🏆", title: "Experiencia comprobada", desc: "Mas de una decada resolviendo casos complejos con resultados exitosos." },
  { icon: "👤", title: "Atencion personalizada", desc: "Cada cliente recibe seguimiento directo y comunicacion transparente." },
  { icon: "✅", title: "Resultados efectivos", desc: "Estrategias legales solidas orientadas a proteger tus intereses." },
];

export default function LawyerTemplate({ site, appointmentsEnabled = true, children, layoutConfig }: TemplateProps) {
  const primary = site.primaryColor || "#1e293b";
  const secondary = site.secondaryColor || "#d4a017";
  const layout = parseLayoutConfig(layoutConfig);

  return (
    <div className="min-h-screen font-sans flex flex-col" style={{ backgroundColor: "#f8fafc" }}>

      {/* Header */}
      <header style={{ backgroundColor: primary, ...getSecStyle(layout, "header", 0) }} className="text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {site.logoUrl ? (
              <img src={site.logoUrl} alt="logo" className="h-11 w-11 rounded object-cover border" style={{ borderColor: secondary }} />
            ) : (
              <div className="w-11 h-11 rounded flex items-center justify-center font-bold text-lg" style={{ backgroundColor: secondary, color: primary }}>
                {site.name[0]}
              </div>
            )}
            <div>
              <p className="font-bold text-lg leading-tight">{site.name}</p>
              <p className="text-xs opacity-60">Estudio Juridico</p>
            </div>
          </div>
          <nav className="hidden md:flex gap-8 text-sm font-medium">
            <a href="#areas" className="opacity-80 hover:opacity-100 transition-opacity">Areas de Practica</a>
            <a href="#equipo" className="opacity-80 hover:opacity-100 transition-opacity">Equipo</a>
            <a href="#contacto" className="opacity-80 hover:opacity-100 transition-opacity">Contacto</a>
            {site.phone && (
              <a href={`tel:${site.phone}`}
                className="px-4 py-1.5 rounded text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ backgroundColor: secondary, color: primary }}>
                {site.phone}
              </a>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section style={{ background: `linear-gradient(160deg, ${primary} 0%, #0f172a 100%)`, ...getSecStyle(layout, "hero", 1) }} className="text-white py-28 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none select-none flex items-center justify-end pr-16">
          <span className="text-[20rem] leading-none">⚖️</span>
        </div>
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded text-sm font-medium mb-6" style={{ backgroundColor: `${secondary}20`, color: secondary, border: `1px solid ${secondary}40` }}>
            <span>⚖️</span> Consultoria Legal Profesional
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-5 max-w-3xl">
            Defendemos tus derechos
          </h1>
          <p className="text-lg opacity-75 max-w-xl mb-10">
            {site.description || "Asesoramiento juridico experto para proteger tus intereses. Comprometidos con la justicia y la excelencia legal."}
          </p>
          <div className="flex flex-wrap gap-4">
            <a href="#citas"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded font-bold text-sm transition-all hover:scale-105 shadow-lg"
              style={{ backgroundColor: secondary, color: primary }}>
              Consulta Gratuita
            </a>
            <a href="#areas"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded font-semibold text-sm border border-white/30 hover:bg-white/10 transition-colors">
              Nuestras Areas
            </a>
          </div>
        </div>
      </section>

      {/* Areas de Practica / Services */}
      <section id="areas" className="py-20" style={getSecStyle(layout, "areas", 2)}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1 rounded text-sm font-semibold mb-3" style={{ backgroundColor: `${secondary}18`, color: secondary }}>
              Especialidades
            </span>
            <h2 className="text-3xl font-bold text-gray-900">Areas de Practica</h2>
            <p className="text-gray-500 mt-2 max-w-lg mx-auto">Soluciones legales integrales en multiples ramas del derecho</p>
          </div>
          {site.services.length === 0 ? (
            <div className="text-center py-16 rounded-lg border border-gray-200">
              <span className="text-4xl block mb-3">⚖️</span>
              <p className="text-gray-400">Las areas de practica estaran disponibles pronto.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {site.services.map((s) => (
                <div key={s.id} className="bg-white rounded-xl p-7 shadow-sm border border-gray-200 flex gap-5 hover:shadow-md transition-shadow group"
                  style={{ borderLeft: `4px solid ${secondary}` }}>
                  <div className="text-3xl shrink-0 mt-0.5">⚖️</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900 group-hover:opacity-80 transition-opacity mb-2">{s.name}</h3>
                    {s.description && <p className="text-gray-500 text-sm leading-relaxed">{s.description}</p>}
                    {s.price != null && (
                      <p className="mt-3 text-sm font-semibold" style={{ color: secondary }}>Desde ${s.price.toFixed(2)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Team */}
      <section id="equipo" style={{ backgroundColor: primary, ...getSecStyle(layout, "team", 3) }} className="py-20 text-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1 rounded text-sm font-semibold mb-3" style={{ backgroundColor: `${secondary}25`, color: secondary }}>
              Profesionales
            </span>
            <h2 className="text-3xl font-bold">Nuestro Equipo</h2>
            <p className="opacity-60 mt-2">Abogados especializados a tu servicio</p>
          </div>
          {site.staff.length === 0 ? (
            <p className="text-center opacity-50 py-8">Informacion del equipo disponible pronto.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {site.staff.map((member) => (
                <div key={member.id} className="rounded-xl p-6 text-center border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-4" style={{ backgroundColor: secondary, color: primary }}>
                    {member.name[0]}
                  </div>
                  <h3 className="font-bold text-white">{member.name}</h3>
                  {member.specialty && (
                    <p className="text-sm mt-1" style={{ color: secondary }}>{member.specialty}</p>
                  )}
                  {!member.isActive && (
                    <span className="mt-2 inline-block text-xs opacity-50 border border-white/20 px-2 py-0.5 rounded-full">No disponible</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-white" style={getSecStyle(layout, "office", 4)}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900">Por que elegirnos</h2>
            <p className="text-gray-500 mt-2">Compromiso y profesionalismo en cada caso</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {WHY_CHOOSE.map((item) => (
              <div key={item.title} className="text-center p-8 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                <div className="text-5xl mb-4">{item.icon}</div>
                <h3 className="font-bold text-xl text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking */}
      <div id="citas" style={{ backgroundColor: "#f1f5f9", ...getSecStyle(layout, "booking", 5) }}>
        {appointmentsEnabled && (
          <>
            <div className="text-center pt-12 pb-2">
              <h2 className="text-3xl font-bold text-gray-900">Consulta gratuita</h2>
              <p className="text-gray-500 mt-2">Agenda tu primera consulta sin costo</p>
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
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-10">Contacto</h2>
          <div className="flex flex-col md:flex-row gap-5 justify-center flex-wrap">
            {site.phone && (
              <a href={`tel:${site.phone}`} className="rounded-xl px-8 py-6 text-center bg-white/10 hover:bg-white/20 transition-colors border border-white/10">
                <p className="text-2xl mb-2">📞</p>
                <p className="text-xs opacity-60 mb-1">Telefono</p>
                <p className="font-semibold">{site.phone}</p>
              </a>
            )}
            {site.address && (
              <div className="rounded-xl px-8 py-6 text-center bg-white/10 border border-white/10">
                <p className="text-2xl mb-2">📍</p>
                <p className="text-xs opacity-60 mb-1">Direccion</p>
                <p className="font-semibold">{site.address}</p>
              </div>
            )}
            {site.email && (
              <a href={`mailto:${site.email}`} className="rounded-xl px-8 py-6 text-center bg-white/10 hover:bg-white/20 transition-colors border border-white/10">
                <p className="text-2xl mb-2">✉️</p>
                <p className="text-xs opacity-60 mb-1">Email</p>
                <p className="font-semibold">{site.email}</p>
              </a>
            )}
            {site.whatsapp && (
              <a href={`https://wa.me/${site.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                className="rounded-xl px-8 py-6 text-center bg-green-600 hover:bg-green-700 transition-colors border border-green-500">
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
      <footer className="py-8 text-center text-sm" style={{ backgroundColor: "#0f172a", color: "rgba(255,255,255,0.5)", ...getSecStyle(layout, "footer", 8) }}>
        <div className="max-w-6xl mx-auto px-6">
          <p className="font-semibold text-white mb-1">{site.name}</p>
          <p>&copy; {new Date().getFullYear()} {site.name}. Todos los derechos reservados.</p>
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
