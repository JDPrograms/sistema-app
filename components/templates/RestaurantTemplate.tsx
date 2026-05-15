import BookingSection from "@/components/booking/BookingSection";

interface Product { id: string; name: string; description?: string | null; price?: number | null; category?: string | null }
interface Site {
  name: string; slug: string; description?: string; phone?: string;
  address?: string; email?: string; primaryColor: string; secondaryColor: string; logoUrl?: string;
  products: Product[];
}

export default function RestaurantTemplate({ site, appointmentsEnabled = true, children }: { site: Site; appointmentsEnabled?: boolean; children?: React.ReactNode }) {
  const primary = site.primaryColor || "#dc2626";
  const categories = [...new Set(site.products.map((p) => p.category).filter(Boolean))] as string[];

  return (
    <div className="min-h-screen font-sans bg-amber-50">
      <header style={{ backgroundColor: primary }} className="text-white">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {site.logoUrl ? (
              <img src={site.logoUrl} alt="logo" className="h-12 w-12 rounded-full object-cover border-2 border-white/30" />
            ) : (
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center font-bold text-xl">
                {site.name[0]}
              </div>
            )}
            <span className="text-2xl font-bold">{site.name}</span>
          </div>
          <nav className="hidden md:flex gap-6 text-sm font-medium">
            <a href="#menu" className="hover:opacity-80">Menu</a>
            <a href="#contacto" className="hover:opacity-80">Contacto</a>
          </nav>
        </div>
      </header>

      <section style={{ background: `linear-gradient(to right, ${primary}, #b91c1c)` }} className="text-white py-20">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-extrabold mb-3">{site.name}</h1>
          <p className="text-xl opacity-80">{site.description || "Sabor autentico en cada plato."}</p>
          <div className="flex items-center justify-center gap-6 mt-8 text-sm">
            {site.phone && (
              <a href={`tel:${site.phone}`} className="bg-white/20 hover:bg-white/30 px-5 py-2 rounded-full backdrop-blur-sm transition-colors">
                {site.phone}
              </a>
            )}
            {site.address && (
              <span className="bg-white/20 px-5 py-2 rounded-full">{site.address}</span>
            )}
          </div>
        </div>
      </section>

      <section id="menu" className="py-16 max-w-5xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-2" style={{ color: primary }}>Nuestro Menu</h2>
        <p className="text-center text-gray-500 mb-10">Ingredientes frescos, preparacion artesanal</p>

        {site.products.length === 0 ? (
          <p className="text-center text-gray-400 py-12">El menu estara disponible pronto.</p>
        ) : (
          <div className="space-y-10">
            {(categories.length > 0 ? categories : [""]).map((cat) => {
              const items = cat ? site.products.filter((p) => p.category === cat) : site.products;
              return (
                <div key={cat || "all"}>
                  {cat && <h3 className="text-xl font-bold text-gray-800 mb-4 border-b border-amber-200 pb-2">{cat}</h3>}
                  <div className="space-y-3">
                    {items.map((p) => (
                      <div key={p.id} className="bg-white rounded-xl p-5 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: `${primary}15` }}>
                            🍽️
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{p.name}</h4>
                            {p.description && <p className="text-sm text-gray-500">{p.description}</p>}
                          </div>
                        </div>
                        {p.price != null && (
                          <span className="font-bold text-xl" style={{ color: primary }}>${p.price.toFixed(2)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {appointmentsEnabled && (
        <BookingSection
          slug={site.slug}
          siteName={site.name}
          primaryColor={primary}
          secondaryColor={site.secondaryColor}
          services={[]}
        />
      )}

      <section id="contacto" className="py-12" style={{ backgroundColor: primary }}>
        <div className="max-w-5xl mx-auto px-6 text-center text-white">
          <h2 className="text-2xl font-bold mb-6">Visitanos</h2>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            {site.phone && <div className="bg-white/10 rounded-xl px-6 py-4"><p className="text-xs opacity-70">Telefono</p><p className="font-semibold">{site.phone}</p></div>}
            {site.address && <div className="bg-white/10 rounded-xl px-6 py-4"><p className="text-xs opacity-70">Direccion</p><p className="font-semibold">{site.address}</p></div>}
            {site.email && <div className="bg-white/10 rounded-xl px-6 py-4"><p className="text-xs opacity-70">Email</p><p className="font-semibold">{site.email}</p></div>}
          </div>
        </div>
      </section>

      {children}
      <footer className="py-6 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} {site.name}. Todos los derechos reservados.
      </footer>
    </div>
  );
}
