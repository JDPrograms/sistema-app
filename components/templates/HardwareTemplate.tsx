import BookingSection from "@/components/booking/BookingSection";
import { parseLayoutConfig, getSecStyle } from "@/lib/layout-config";

interface Product { id: string; name: string; description?: string | null; price?: number | null; stock?: number | null; category?: string | null }
interface Site {
  name: string; slug: string; description?: string; phone?: string;
  address?: string; email?: string; primaryColor: string; secondaryColor: string; logoUrl?: string;
  products: Product[];
}

export default function HardwareTemplate({ site, appointmentsEnabled = true, children, layoutConfig }: { site: Site; appointmentsEnabled?: boolean; children?: React.ReactNode; layoutConfig?: string | null }) {
  const primary = site.primaryColor || "#ea580c";
  const categories = [...new Set(site.products.map((p) => p.category).filter(Boolean))] as string[];
  const layout = parseLayoutConfig(layoutConfig);
  const heroData = (layout as any).heroData || {};

  return (
    <div className="min-h-screen font-sans flex flex-col">
      <header style={{ backgroundColor: primary, ...getSecStyle(layout, "header", 0) }} className="text-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {site.logoUrl ? (
              <img src={site.logoUrl} alt="logo" className="h-10 w-10 rounded object-cover" />
            ) : (
              <div className="w-10 h-10 bg-white/20 rounded flex items-center justify-center font-bold text-lg">
                {site.name[0]}
              </div>
            )}
            <div>
              <p className="font-bold text-lg leading-tight">{site.name}</p>
              <p className="text-xs opacity-70">Ferreteria</p>
            </div>
          </div>
          <nav className="hidden md:flex gap-6 text-sm font-medium">
            <a href="#productos" className="hover:opacity-80">Productos</a>
            <a href="#contacto" className="hover:opacity-80">Contacto</a>
          </nav>
        </div>
      </header>

      <div style={{ backgroundColor: primary, ...getSecStyle(layout, "hero", 1) }} className="text-white py-12">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-4xl font-extrabold mb-2">{site.name}</h1>
          <p className="text-lg opacity-80">{site.description || "Herramientas y materiales para construccion y hogar."}</p>
        </div>
      </div>

      <section id="productos" className="py-12 bg-gray-50" style={getSecStyle(layout, "products", 2)}>
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-bold mb-8 text-gray-900">Catalogo de Productos</h2>
          {site.products.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p>El catalogo de productos estara disponible pronto.</p>
            </div>
          ) : (
            <div>
              {categories.length > 0 && (
                <div className="flex gap-2 mb-6 flex-wrap">
                  {categories.map((cat) => (
                    <span key={cat} className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-600">
                      {cat}
                    </span>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {site.products.map((p) => (
                  <div key={p.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="h-40 flex items-center justify-center text-4xl" style={{ backgroundColor: `${primary}15` }}>
                      🔧
                    </div>
                    <div className="p-4">
                      {p.category && <p className="text-xs text-gray-400 mb-1">{p.category}</p>}
                      <h3 className="font-semibold text-gray-900">{p.name}</h3>
                      {p.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.description}</p>}
                      <div className="flex items-center justify-between mt-3">
                        {p.price != null && (
                          <span className="font-bold text-lg" style={{ color: primary }}>${p.price.toFixed(2)}</span>
                        )}
                        {p.stock != null && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${p.stock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {p.stock > 0 ? `Stock: ${p.stock}` : "Agotado"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <div style={getSecStyle(layout, "booking", 3)}>
        {appointmentsEnabled && (
          <BookingSection
            slug={site.slug}
            siteName={site.name}
            primaryColor={primary}
            secondaryColor={site.secondaryColor}
            services={[]}
          />
        )}
      </div>

      <section id="contacto" className="py-12 bg-gray-50" style={getSecStyle(layout, "contact", 4)}>
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Contactenos</h2>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            {site.phone && <div className="bg-gray-50 rounded-xl px-6 py-4"><p className="text-xs text-gray-400">Telefono</p><p className="font-semibold">{site.phone}</p></div>}
            {site.address && <div className="bg-gray-50 rounded-xl px-6 py-4"><p className="text-xs text-gray-400">Direccion</p><p className="font-semibold">{site.address}</p></div>}
            {site.email && <div className="bg-gray-50 rounded-xl px-6 py-4"><p className="text-xs text-gray-400">Email</p><p className="font-semibold">{site.email}</p></div>}
          </div>
        </div>
      </section>

      <div style={getSecStyle(layout, "blocks", 5)}>{children}</div>
      <footer style={{ backgroundColor: primary, ...getSecStyle(layout, "footer", 6) }} className="text-white py-6 text-center text-sm">
        &copy; {new Date().getFullYear()} {site.name}
      </footer>
    </div>
  );
}
