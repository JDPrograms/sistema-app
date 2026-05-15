import BookingSection from "@/components/booking/BookingSection";

interface Service { id: string; name: string; description?: string | null; price?: number | null; duration?: number | null }
interface Site {
  name: string; slug: string; description?: string; phone?: string;
  address?: string; email?: string; primaryColor: string; secondaryColor: string; logoUrl?: string;
  services: Service[];
}

export default function BarbershopTemplate({ site, appointmentsEnabled = true, children }: { site: Site; appointmentsEnabled?: boolean; children?: React.ReactNode }) {
  const primary = site.primaryColor || "#1a1a1a";
  const secondary = site.secondaryColor || "#c9a96e";

  return (
    <div className="min-h-screen font-sans">
      <header style={{ backgroundColor: primary }} className="text-white">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {site.logoUrl ? (
              <img src={site.logoUrl} alt="logo" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg" style={{ backgroundColor: secondary, color: primary }}>
                {site.name[0]}
              </div>
            )}
            <span className="text-xl font-bold">{site.name}</span>
          </div>
          <nav className="hidden md:flex gap-6 text-sm font-medium">
            <a href="#servicios" className="hover:opacity-80 transition-opacity">Servicios</a>
            <a href="#contacto" className="hover:opacity-80 transition-opacity">Contacto</a>
          </nav>
        </div>
      </header>

      <section style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }} className="text-white py-24">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-extrabold mb-4">{site.name}</h1>
          <p className="text-lg opacity-80 max-w-xl mx-auto mb-8">
            {site.description || "Bienvenido a nuestra barberia. Calidad y estilo para ti."}
          </p>
          {site.phone && (
            <a href={`tel:${site.phone}`}
              className="inline-block px-8 py-3 rounded-full font-semibold text-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: "white", color: primary }}>
              Reservar cita · {site.phone}
            </a>
          )}
        </div>
      </section>

      <section id="servicios" className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-10" style={{ color: primary }}>Nuestros Servicios</h2>
          {site.services.length === 0 ? (
            <p className="text-center text-gray-400">Los servicios estaran disponibles pronto.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {site.services.map((s) => (
                <div key={s.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-bold text-lg text-gray-900 mb-2">{s.name}</h3>
                  {s.description && <p className="text-gray-500 text-sm mb-4">{s.description}</p>}
                  <div className="flex items-center justify-between mt-auto">
                    {s.price != null && (
                      <span className="font-bold text-xl" style={{ color: primary }}>${s.price.toFixed(2)}</span>
                    )}
                    {s.duration != null && (
                      <span className="text-xs text-gray-400">{s.duration} min</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {appointmentsEnabled && (
        <BookingSection
          slug={site.slug}
          siteName={site.name}
          primaryColor={primary}
          secondaryColor={secondary}
          services={site.services}
        />
      )}

      <section id="contacto" className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-8" style={{ color: primary }}>Contacto</h2>
          <div className="flex flex-col md:flex-row gap-6 justify-center">
            {site.phone && (
              <div className="bg-gray-50 rounded-xl px-8 py-5">
                <p className="text-xs text-gray-400 mb-1">Telefono</p>
                <p className="font-semibold text-gray-900">{site.phone}</p>
              </div>
            )}
            {site.address && (
              <div className="bg-gray-50 rounded-xl px-8 py-5">
                <p className="text-xs text-gray-400 mb-1">Direccion</p>
                <p className="font-semibold text-gray-900">{site.address}</p>
              </div>
            )}
            {site.email && (
              <div className="bg-gray-50 rounded-xl px-8 py-5">
                <p className="text-xs text-gray-400 mb-1">Email</p>
                <p className="font-semibold text-gray-900">{site.email}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {children}
      <footer style={{ backgroundColor: primary }} className="text-white py-8 text-center text-sm opacity-80">
        &copy; {new Date().getFullYear()} {site.name}. Todos los derechos reservados.
      </footer>
    </div>
  );
}
