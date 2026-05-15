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

export default function ClinicTemplate({ site, appointmentsEnabled = true, children }: TemplateProps) {
  const primary = site.primaryColor || "#1d4ed8";
  const secondary = site.secondaryColor || "#0ea5e9";
  const activeStaff = site.staff.filter((s) => s.isActive);

  return (
    <div className="min-h-screen font-sans bg-[#eff6ff] text-gray-900">

      {/* HEADER */}
      <header className="bg-white sticky top-0 z-50 shadow-sm" style={{ borderBottom: `3px solid ${primary}` }}>
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
              <span className="text-xl font-bold text-gray-900">{site.name}</span>
              <p className="text-xs text-gray-500 leading-none">Centro Medico</p>
            </div>
          </div>
          <nav className="hidden md:flex gap-8 text-sm font-semibold">
            <a href="#especialidades" style={{ color: primary }} className="hover:opacity-70 transition-opacity">Especialidades</a>
            <a href="#equipo" style={{ color: primary }} className="hover:opacity-70 transition-opacity">Equipo</a>
            <a href="#citas" style={{ color: primary }} className="hover:opacity-70 transition-opacity">Citas</a>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section
        className="py-24"
        style={{ background: `linear-gradient(135deg, #dbeafe 0%, #eff6ff 60%, #e0f2fe 100%)` }}
      >
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-semibold px-4 py-2 rounded-full mb-6">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Atención médica de calidad
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
              Tu salud,<br />
              <span style={{ color: primary }}>nuestra prioridad</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-lg">
              {site.description || "Brindamos atención médica integral con profesionales especializados y tecnología de vanguardia."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="#citas"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90"
                style={{ backgroundColor: primary }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Agendar Cita
              </a>
              {site.phone && (
                <a
                  href={`tel:${site.phone}`}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-sm border-2 transition-colors hover:bg-blue-50"
                  style={{ borderColor: primary, color: primary }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  {site.phone}
                </a>
              )}
            </div>
          </div>
          <div className="hidden md:flex flex-col items-center gap-4">
            <div className="w-40 h-40 rounded-full flex items-center justify-center text-7xl shadow-xl" style={{ backgroundColor: `${primary}15`, border: `3px solid ${primary}30` }}>
              🏥
            </div>
          </div>
        </div>
      </section>

      {/* ESPECIALIDADES */}
      <section id="especialidades" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Nuestras Especialidades</h2>
            <p className="text-gray-500">Servicios médicos diseñados para tu bienestar</p>
            <div className="w-16 h-1 mx-auto mt-4 rounded-full" style={{ backgroundColor: primary }} />
          </div>

          {site.services.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-blue-100">
              <p className="text-4xl mb-3">🩺</p>
              <p className="text-gray-500 font-medium">Especialidades disponibles pronto</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {site.services.map((s) => (
                <div key={s.id} className="bg-white rounded-2xl p-6 shadow-sm border border-blue-50 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-2xl" style={{ backgroundColor: `${primary}15` }}>
                    🩺
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{s.name}</h3>
                  {s.description && <p className="text-sm text-gray-500 leading-relaxed mb-4">{s.description}</p>}
                  <div className="flex items-center gap-2 flex-wrap">
                    {s.price != null && (
                      <span className="text-sm font-bold px-3 py-1 rounded-full text-white" style={{ backgroundColor: primary }}>
                        ${s.price.toFixed(2)}
                      </span>
                    )}
                    {s.duration != null && (
                      <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        {s.duration} min
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* EQUIPO MEDICO */}
      {activeStaff.length > 0 && (
        <section id="equipo" className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Nuestro Equipo Medico</h2>
              <p className="text-gray-500">Profesionales comprometidos con tu salud</p>
              <div className="w-16 h-1 mx-auto mt-4 rounded-full" style={{ backgroundColor: primary }} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {activeStaff.map((doctor) => (
                <div key={doctor.id} className="bg-[#eff6ff] rounded-2xl p-6 text-center border border-blue-100">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4" style={{ backgroundColor: primary }}>
                    {doctor.name[0].toUpperCase()}
                  </div>
                  <h3 className="font-bold text-gray-900">{doctor.name}</h3>
                  {doctor.specialty && (
                    <span className="inline-block mt-2 text-xs font-semibold px-3 py-1 rounded-full text-white" style={{ backgroundColor: secondary }}>
                      {doctor.specialty}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* INFORMACION DEL CONSULTORIO */}
      <section className="py-16 bg-[#eff6ff]">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-10">Informacion del Consultorio</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {site.address && (
              <div className="bg-white rounded-2xl p-6 border border-blue-100 flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primary}15` }}>
                  <svg className="w-5 h-5" style={{ color: primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Direccion</p>
                  <p className="text-gray-900 font-medium">{site.address}</p>
                </div>
              </div>
            )}
            {site.phone && (
              <a href={`tel:${site.phone}`} className="bg-white rounded-2xl p-6 border border-blue-100 flex gap-4 items-start hover:border-blue-300 transition-colors">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primary}15` }}>
                  <svg className="w-5 h-5" style={{ color: primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Telefono</p>
                  <p className="text-gray-900 font-medium">{site.phone}</p>
                </div>
              </a>
            )}
            {site.email && (
              <a href={`mailto:${site.email}`} className="bg-white rounded-2xl p-6 border border-blue-100 flex gap-4 items-start hover:border-blue-300 transition-colors">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primary}15` }}>
                  <svg className="w-5 h-5" style={{ color: primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Email</p>
                  <p className="text-gray-900 font-medium">{site.email}</p>
                </div>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* BOOKING */}
      {appointmentsEnabled && (
        <div id="citas">
          <BookingSection
            slug={site.slug}
            siteName={site.name}
            primaryColor={primary}
            secondaryColor={secondary}
            services={site.services}
          />
        </div>
      )}

      {children}
      {/* FOOTER */}
      <footer className="py-8 text-center text-white" style={{ backgroundColor: primary }}>
        <p className="font-semibold text-lg mb-1">{site.name}</p>
        <p className="text-sm opacity-70">&copy; {new Date().getFullYear()} Todos los derechos reservados.</p>
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
