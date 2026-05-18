import BookingSection from "@/components/booking/BookingSection";
import { parseLayoutConfig, getSecStyle } from "@/lib/layout-config";

interface Service { id: string; name: string; description?: string | null; price?: number | null; duration?: number | null; imageUrl?: string | null; }
interface Site {
  name: string; slug: string; description?: string; phone?: string;
  address?: string; email?: string; primaryColor: string; secondaryColor: string;
  logoUrl?: string; whatsapp?: string; socialLinks?: string;
  services: Service[];
}

export default function TutorTemplate({ site, appointmentsEnabled = true, children, layoutConfig }: { site: Site; appointmentsEnabled?: boolean; children?: React.ReactNode; layoutConfig?: string | null }) {
  const primary = site.primaryColor || "#2563eb";
  const secondary = site.secondaryColor || "#f59e0b";
  const layout = parseLayoutConfig(layoutConfig);
  const heroData = (layout as any).heroData || {};

  return (
    <div className="min-h-screen font-sans flex flex-col bg-white">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-100" style={getSecStyle(layout, "header", 0)}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {site.logoUrl
              ? <img src={site.logoUrl} alt="logo" className="h-12 w-12 rounded-xl object-cover" />
              : <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-black text-white" style={{ backgroundColor: primary }}>📚</div>}
            <span className="text-xl font-black" style={{ color: primary }}>{site.name}</span>
          </div>
          <nav className="hidden md:flex gap-8 text-sm font-semibold text-gray-600">
            <a href="#servicios" className="hover:text-gray-900 transition-colors">Servicios</a>
            <a href="#como-funciona" className="hover:text-gray-900 transition-colors">Cómo Funciona</a>
            <a href="#reservas" className="hover:text-gray-900 transition-colors">Agendar</a>
          </nav>
          {site.whatsapp && (
            <a href={`https://wa.me/${site.whatsapp.replace(/\D/g, "")}`}
              className="hidden md:inline-flex items-center gap-2 px-5 py-2 rounded-full text-white text-sm font-bold shadow-md hover:opacity-90 transition-opacity"
              style={{ backgroundColor: primary }}>
              💬 Consultar
            </a>
          )}
        </div>
      </header>

      {/* HERO */}
      <section className="relative py-24 px-6 overflow-hidden" style={getSecStyle(layout, "hero", 1)}>
        {heroData.bgImage && (
          <>
            <img src={heroData.bgImage} alt="hero" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-white/80" />
          </>
        )}
        {!heroData.bgImage && (
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${primary}10 0%, ${secondary}10 100%)` }} />
        )}
        <div className="relative z-10 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block px-4 py-1.5 rounded-full text-sm font-bold mb-6" style={{ backgroundColor: `${primary}15`, color: primary }}>
              Tutor & Consultor
            </span>
            <h1 className="text-5xl md:text-6xl font-black leading-tight text-gray-900 mb-6">
              {heroData.title || site.name}
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              {heroData.subtitle || site.description || "Aprende, crece y alcanza tus metas con orientación experta."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href={heroData.ctaUrl || "#reservas"}
                className="inline-block px-8 py-4 rounded-xl font-bold text-white text-lg shadow-lg hover:opacity-90 transition-opacity text-center"
                style={{ backgroundColor: primary }}>
                {heroData.ctaText || "Agendar Sesión"}
              </a>
              <a href="#servicios" className="inline-block px-8 py-4 rounded-xl font-bold text-gray-700 border-2 border-gray-200 hover:border-gray-400 transition-colors text-center">
                Ver Servicios
              </a>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
              <div className="text-center mb-6">
                {site.logoUrl
                  ? <img src={site.logoUrl} alt="profile" className="w-24 h-24 rounded-2xl object-cover mx-auto" />
                  : <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-4xl font-black text-white mx-auto" style={{ backgroundColor: primary }}>{site.name[0]}</div>}
              </div>
              <h3 className="text-xl font-black text-gray-900 text-center mb-2">{site.name}</h3>
              <p className="text-gray-500 text-center text-sm mb-6">Consultor Profesional</p>
              <div className="space-y-3">
                {site.services.slice(0, 3).map((s) => (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: `${primary}08` }}>
                    <span className="text-xl">✅</span>
                    <span className="text-sm font-semibold text-gray-700">{s.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      {site.services.length > 0 && (
        <section id="servicios" className="py-20 bg-gray-50" style={getSecStyle(layout, "services", 2)}>
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-4xl font-black text-center text-gray-900 mb-3">Servicios</h2>
            <p className="text-center text-gray-500 mb-12">Modalidades adaptadas a tus necesidades</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {site.services.map((s, i) => (
                <div key={s.id} className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 text-white font-bold" style={{ backgroundColor: primary }}>
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 mb-2">{s.name}</h3>
                      {s.description && <p className="text-gray-500 text-sm mb-3">{s.description}</p>}
                      <div className="flex items-center gap-3 flex-wrap">
                        {s.price != null && (
                          <span className="font-black text-lg" style={{ color: primary }}>${s.price.toFixed(2)}</span>
                        )}
                        {s.duration != null && (
                          <span className="text-sm text-gray-400">⏱ {s.duration} min</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* HOW IT WORKS */}
      <section id="como-funciona" className="py-20 bg-white" style={getSecStyle(layout, "howItWorks", 3)}>
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-black text-gray-900 mb-3">¿Cómo Funciona?</h2>
          <p className="text-gray-500 mb-12">Comenzar es fácil y rápido</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Elige tu servicio", desc: "Selecciona el tipo de sesión o paquete que mejor se adapte a ti." },
              { step: "2", title: "Reserva tu horario", desc: "Elige día y hora disponible en nuestro calendario." },
              { step: "3", title: "Comienza a aprender", desc: "Conectamos y trabajamos juntos hacia tus objetivos." },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white mb-5 shadow-lg" style={{ backgroundColor: primary }}>
                  {item.step}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
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
      <section id="contacto" className="py-20 bg-gray-50" style={getSecStyle(layout, "contact", 5)}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-black text-gray-900 mb-3">Contáctame</h2>
          <p className="text-gray-500 mb-10">¿Tienes dudas? Escríbeme directamente.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {site.email && (
              <a href={`mailto:${site.email}`} className="flex items-center gap-3 px-8 py-4 bg-white rounded-2xl border-2 border-gray-100 hover:border-gray-300 transition-colors shadow-sm">
                <span className="text-2xl">✉️</span>
                <div className="text-left">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Email</p>
                  <p className="font-bold text-gray-900">{site.email}</p>
                </div>
              </a>
            )}
            {site.phone && (
              <a href={`tel:${site.phone}`} className="flex items-center gap-3 px-8 py-4 bg-white rounded-2xl border-2 border-gray-100 hover:border-gray-300 transition-colors shadow-sm">
                <span className="text-2xl">📞</span>
                <div className="text-left">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Teléfono</p>
                  <p className="font-bold text-gray-900">{site.phone}</p>
                </div>
              </a>
            )}
            {site.whatsapp && (
              <a href={`https://wa.me/${site.whatsapp.replace(/\D/g, "")}`} className="flex items-center gap-3 px-8 py-4 rounded-2xl text-white shadow-md hover:opacity-90 transition-opacity" style={{ backgroundColor: "#25D366" }}>
                <span className="text-2xl">💬</span>
                <div className="text-left">
                  <p className="text-xs text-white/70 uppercase tracking-wide">WhatsApp</p>
                  <p className="font-bold">{site.whatsapp}</p>
                </div>
              </a>
            )}
          </div>
        </div>
      </section>

      <div style={getSecStyle(layout, "blocks", 6)}>{children}</div>
      <footer className="py-8 text-center text-sm text-gray-400 border-t border-gray-100 bg-white" style={getSecStyle(layout, "footer", 7)}>
        &copy; {new Date().getFullYear()} {site.name}
      </footer>
    </div>
  );
}
