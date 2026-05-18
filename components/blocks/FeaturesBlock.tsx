interface Feature { icon: string; title: string; description: string; }
interface FeaturesConfig { title?: string; subtitle?: string; items: Feature[]; }

export default function FeaturesBlock({ config, primaryColor }: { config: FeaturesConfig; primaryColor: string }) {
  if (!config.items?.length) return null;
  return (
    <section className="py-16 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        {config.title && <h2 className="text-3xl font-bold text-center mb-3 text-gray-900">{config.title}</h2>}
        {config.subtitle && <p className="text-center text-gray-500 mb-10 max-w-2xl mx-auto">{config.subtitle}</p>}
        <div className={`grid gap-6 ${config.items.length <= 2 ? "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
          {config.items.map((item, i) => (
            <div key={i} className="flex gap-4 p-5 rounded-xl border border-gray-100 hover:shadow-sm transition-shadow">
              <div className="text-3xl flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl"
                style={{ backgroundColor: `${primaryColor}15` }}>
                {item.icon}
              </div>
              <div>
                <p className="font-bold text-gray-900 mb-1">{item.title}</p>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
