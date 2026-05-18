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

const BENEFITS = [
  {
    icon: "🎯",
    title: "Metodologia efectiva",
    description: "Programas de aprendizaje estructurados y probados para maximizar tu progreso.",
  },
  {
    icon: "🏆",
    title: "Certificacion incluida",
    description: "Obtén un certificado reconocido al completar cada curso o programa.",
  },
  {
    icon: "⏰",
    title: "Horarios flexibles",
    description: "Clases presenciales y en linea adaptadas a tu ritmo y disponibilidad.",
  },
];

export default function SchoolTemplate({ site, appointmentsEnabled = true, children, layoutConfig }: TemplateProps) {
  const primary = site.primaryColor || "#4f46e5";
  const secondary = site.secondaryColor || "#818cf8";
  const activeStaff = site.staff.filter((s) => s.isActive);
  const layout = parseLayoutConfig(layoutConfig);
  const heroData = (layout as any).heroData || {};

  return (
    <div className="min-h-screen font-sans bg-white text-gray-900 flex flex-col">

      {/* HEADER */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm" style={getSecStyle(layout, "header", 0)}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {site.logoUrl ? (
              <img src={site.logoUrl} alt="logo" className="h-10 w-10 rounded-xl object-cover border-2" style={{ borderColor: primary }} />
            ) : (
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg text-white" style={{ backgroundColor: primary }}>
                {site.name[0]}
              </div>
            )}
            <span className="text-xl font-extrabold text-gray-900">{site.name}</span>
          </div>
          <nav className="hidden md:flex gap-8 text-sm font-semibold text-gray-500">
            <a href="#cursos" className="hover:text-gray-900 transition-colors">Cursos</a>
            <a href="#instructores" className="hover:text-gray-900 transition-colors">Instructores</a>
            <a
              href="#inscribirse"
              className="px-5 py-2 rounded-full text-white text-sm font-bold transition-opacity hover:opacity-80"
              style={{ backgroundColor: primary }}
            >
              Inscribirse
            </a>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section
        className="py-24 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${primary}08 0%, white 40%, ${secondary}12 100%)`, ...getSecStyle(layout, "hero", 1) }}
      >
        {/* Decorative blobs */}
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-10" style={{ backgroundColor: primary }} />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full opacity-5" style={{ backgroundColor: secondary }} />

        <div className="relative max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1">
            <div
              className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full mb-6"
              style={{ backgroundColor: `${primary}12`, color: primary }}
            >
              📚 Aprende con los mejores
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight text-gray-900 mb-6">
              Transforma tu futuro con{" "}
              <span style={{ color: primary }}>{site.name}</span>
            </h1>
            <p className="text-lg text-gray-500 mb-10 max-w-lg leading-relaxed">
              {site.description || "Cursos de calidad con instructores expertos. Aprende a tu ritmo y obtén la certificacion que impulsa tu carrera."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="#inscribirse"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90"
                style={{ backgroundColor: primary }}
              >
                Inscribirse ahora
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </a>
              <a
                href="#cursos"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-sm border-2 transition-colors hover:bg-gray-50"
                style={{ borderColor: `${primary}40`, color: primary }}
              >
                Ver cursos
              </a>
            </div>
          </div>
          <div className="hidden md:flex flex-col items-center gap-4 flex-shrink-0">
            <div
              className="w-48 h-48 rounded-3xl flex items-center justify-center text-8xl shadow-2xl"
              style={{ background: `linear-gradient(135deg, ${primary}20, ${secondary}20)`, border: `2px solid ${primary}20` }}
            >
              🎓
            </div>
          </div>
        </div>
      </section>

      {/* NUESTROS CURSOS */}
      <section id="cursos" className="py-20 bg-gray-50" style={getSecStyle(layout, "courses", 2)}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Nuestros Cursos</h2>
            <p className="text-gray-500">Programas diseñados para tu crecimiento profesional</p>
            <div className="w-16 h-1 mx-auto mt-4 rounded-full" style={{ backgroundColor: primary }} />
          </div>

          {site.services.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
              <p className="text-4xl mb-3">📖</p>
              <p className="text-gray-500 font-medium">Cursos disponibles pronto</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {site.services.map((course) => (
                <div
                  key={course.id}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow"
                >
                  <div
                    className="h-3 w-full"
                    style={{ backgroundColor: primary }}
                  />
                  <div className="p-6">
                    <h3 className="text-lg font-extrabold text-gray-900 mb-2">{course.name}</h3>
                    {course.description && (
                      <p className="text-sm text-gray-500 leading-relaxed mb-4">{course.description}</p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap mt-auto">
                      {course.duration != null && (
                        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700">
                          Duracion: {course.duration} horas
                        </span>
                      )}
                      {course.price != null ? (
                        <span className="text-sm font-bold px-3 py-1 rounded-full text-white" style={{ backgroundColor: primary }}>
                          ${course.price.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-600">
                          Consultar precio
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* INSTRUCTORES */}
      <div style={getSecStyle(layout, "instructors", 3)}>
      {activeStaff.length > 0 && (
        <section id="instructores" className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Instructores</h2>
              <p className="text-gray-500">Expertos comprometidos con tu aprendizaje</p>
              <div className="w-16 h-1 mx-auto mt-4 rounded-full" style={{ backgroundColor: primary }} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {activeStaff.map((instructor) => (
                <div key={instructor.id} className="text-center bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:border-indigo-100 transition-colors">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white mx-auto mb-4"
                    style={{ backgroundColor: primary }}
                  >
                    {instructor.name[0].toUpperCase()}
                  </div>
                  <h3 className="font-bold text-gray-900">{instructor.name}</h3>
                  {instructor.specialty && (
                    <p className="text-sm text-gray-500 mt-1">{instructor.specialty}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      </div>

      {/* POR QUE ELEGIRNOS */}
      <section className="py-20" style={{ background: `linear-gradient(135deg, ${primary}08, ${secondary}10)`, ...getSecStyle(layout, "benefits", 4) }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Por que elegirnos</h2>
            <p className="text-gray-500">Razones que nos hacen diferentes</p>
            <div className="w-16 h-1 mx-auto mt-4 rounded-full" style={{ backgroundColor: primary }} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {BENEFITS.map((b) => (
              <div key={b.title} className="bg-white rounded-2xl p-8 text-center border border-white shadow-sm hover:shadow-md transition-shadow">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5"
                  style={{ backgroundColor: `${primary}12` }}
                >
                  {b.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{b.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BOOKING */}
      <div id="inscribirse" style={getSecStyle(layout, "booking", 5)}>
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
      <section id="contacto" className="py-16 bg-gray-50" style={getSecStyle(layout, "contact", 6)}>
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-extrabold text-center text-gray-900 mb-10">Contacto</h2>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            {site.phone && (
              <a
                href={`tel:${site.phone}`}
                className="bg-white rounded-xl px-8 py-5 text-center border border-gray-200 hover:border-indigo-200 hover:shadow-sm transition-all"
              >
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Telefono</p>
                <p className="font-bold text-gray-900">{site.phone}</p>
              </a>
            )}
            {site.address && (
              <div className="bg-white rounded-xl px-8 py-5 text-center border border-gray-200">
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Direccion</p>
                <p className="font-bold text-gray-900">{site.address}</p>
              </div>
            )}
            {site.email && (
              <a
                href={`mailto:${site.email}`}
                className="bg-white rounded-xl px-8 py-5 text-center border border-gray-200 hover:border-indigo-200 hover:shadow-sm transition-all"
              >
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Email</p>
                <p className="font-bold text-gray-900">{site.email}</p>
              </a>
            )}
          </div>
        </div>
      </section>

      <div style={getSecStyle(layout, "blocks", 7)}>{children}</div>
      {/* FOOTER */}
      <footer className="py-8 text-center text-white" style={{ backgroundColor: primary, ...getSecStyle(layout, "footer", 8) }}>
        <p className="font-bold text-lg mb-1">{site.name}</p>
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
