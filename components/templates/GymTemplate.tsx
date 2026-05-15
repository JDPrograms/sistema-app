import BookingSection from "@/components/booking/BookingSection";

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
interface TemplateProps { site: SiteData; appointmentsEnabled?: boolean; children?: React.ReactNode; }

export default function GymTemplate({ site, appointmentsEnabled = true, children }: TemplateProps) {
  const primary = site.primaryColor || "#ef4444";
  const secondary = site.secondaryColor || "#f97316";
  const activeStaff = site.staff.filter((s) => s.isActive);

  return (
    <div className="min-h-screen font-sans bg-[#111] text-white">

      {/* HEADER */}
      <header className="bg-[#0a0a0a] border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {site.logoUrl ? (
              <img src={site.logoUrl} alt="logo" className="h-10 w-10 rounded-full object-cover border-2" style={{ borderColor: primary }} />
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-lg" style={{ backgroundColor: primary }}>
                {site.name[0]}
              </div>
            )}
            <span className="text-xl font-black tracking-tight uppercase">{site.name}</span>
          </div>
          <nav className="hidden md:flex gap-8 text-sm font-semibold uppercase tracking-widest">
            <a href="#clases" className="text-gray-400 hover:text-white transition-colors">Clases</a>
            <a href="#entrenadores" className="text-gray-400 hover:text-white transition-colors">Entrenadores</a>
            <a href="#contacto" className="text-gray-400 hover:text-white transition-colors">Contacto</a>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section
        className="relative py-28 flex items-center justify-center overflow-hidden"
        style={{ background: `linear-gradient(135deg, #111 0%, #1a1a1a 50%, ${primary}22 100%)` }}
      >
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)", backgroundSize: "20px 20px" }} />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="inline-block px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-6 border" style={{ borderColor: primary, color: primary }}>
            Entrena. Superate. Conquista.
          </div>
          <h1 className="text-5xl md:text-7xl font-black uppercase leading-none mb-6">
            {site.name}
          </h1>
          <p className="text-lg text-gray-400 max-w-xl mx-auto mb-10">
            {site.description || "El lugar donde los limites se rompen y los resultados hablan por si solos."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {site.phone && (
              <a
                href={`tel:${site.phone}`}
                className="px-8 py-4 rounded-full font-bold text-sm uppercase tracking-widest transition-opacity hover:opacity-80"
                style={{ backgroundColor: primary }}
              >
                Llamar ahora
              </a>
            )}
            <a
              href="#clases"
              className="px-8 py-4 rounded-full font-bold text-sm uppercase tracking-widest border border-white/20 hover:border-white/50 transition-colors"
            >
              Ver clases
            </a>
          </div>
        </div>
      </section>

      {/* NUESTRAS CLASES */}
      <section id="clases" className="py-20 max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-black uppercase" style={{ color: primary }}>Nuestras Clases</h2>
          <p className="text-gray-500 mt-2">Programas diseñados para todos los niveles</p>
        </div>

        {site.services.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl">
            <p className="text-2xl mb-2">🏋️</p>
            <p className="text-gray-500">Clases disponibles pronto</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {site.services.map((s) => (
              <div
                key={s.id}
                className="bg-[#1a1a1a] rounded-2xl p-6 border border-white/5 hover:border-white/20 transition-colors overflow-hidden relative"
                style={{ borderLeft: `4px solid ${primary}` }}
              >
                <h3 className="text-lg font-black uppercase mb-2">{s.name}</h3>
                {s.description && <p className="text-sm text-gray-400 mb-4 leading-relaxed">{s.description}</p>}
                <div className="flex items-center gap-3 mt-auto">
                  {s.price != null && (
                    <span className="font-black text-xl" style={{ color: primary }}>
                      ${s.price.toFixed(2)}
                    </span>
                  )}
                  {s.duration != null && (
                    <span className="text-xs text-gray-500 bg-white/5 px-3 py-1 rounded-full">
                      {s.duration} min
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ENTRENADORES */}
      {activeStaff.length > 0 && (
        <section id="entrenadores" className="py-20 bg-[#0d0d0d]">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-black uppercase" style={{ color: primary }}>Nuestros Entrenadores</h2>
              <p className="text-gray-500 mt-2">Profesionales dedicados a tu progreso</p>
            </div>
            <div className="flex flex-wrap justify-center gap-8">
              {activeStaff.map((trainer) => (
                <div key={trainer.id} className="text-center flex flex-col items-center gap-3">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black border-2"
                    style={{ backgroundColor: `${primary}20`, borderColor: primary }}
                  >
                    {trainer.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-white">{trainer.name}</p>
                    {trainer.specialty && (
                      <p className="text-xs text-gray-500 mt-0.5">{trainer.specialty}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* BOOKING */}
      {appointmentsEnabled && (
        <div className="bg-[#111]">
          <BookingSection
            slug={site.slug}
            siteName={site.name}
            primaryColor={primary}
            secondaryColor={secondary}
            services={site.services}
          />
        </div>
      )}

      {/* CONTACTO */}
      <section id="contacto" className="py-16 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-black uppercase text-center mb-10" style={{ color: primary }}>Contacto</h2>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            {site.phone && (
              <a href={`tel:${site.phone}`} className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-8 py-5 text-center transition-colors">
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Telefono</p>
                <p className="font-bold">{site.phone}</p>
              </a>
            )}
            {site.address && (
              <div className="bg-white/5 border border-white/10 rounded-xl px-8 py-5 text-center">
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Direccion</p>
                <p className="font-bold">{site.address}</p>
              </div>
            )}
            {site.email && (
              <a href={`mailto:${site.email}`} className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-8 py-5 text-center transition-colors">
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Email</p>
                <p className="font-bold">{site.email}</p>
              </a>
            )}
          </div>
        </div>
      </section>

      {children}
      {/* FOOTER */}
      <footer className="bg-black py-8 text-center border-t border-white/5">
        <p className="text-sm text-gray-600">
          &copy; {new Date().getFullYear()} <span className="font-bold text-gray-400">{site.name}</span>. Todos los derechos reservados.
        </p>
      </footer>

      {/* WHATSAPP BUBBLE */}
      {site.whatsapp && (
        <a
          href={"https://wa.me/" + site.whatsapp.replace(/\D/g, "")}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-400 rounded-full flex items-center justify-center shadow-lg shadow-green-900/40 transition-colors"
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
