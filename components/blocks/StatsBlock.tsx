interface StatItem { value: string; label: string; }
interface StatsConfig { title?: string; items: StatItem[]; }

export default function StatsBlock({ config, primaryColor }: { config: StatsConfig; primaryColor: string }) {
  if (!config.items?.length) return null;
  return (
    <section className="py-16" style={{ backgroundColor: `${primaryColor}08` }}>
      <div className="max-w-5xl mx-auto px-6">
        {config.title && (
          <h2 className="text-3xl font-bold text-center mb-10 text-gray-900">{config.title}</h2>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {config.items.map((item, i) => (
            <div key={i} className="text-center">
              <p className="text-4xl font-extrabold mb-2" style={{ color: primaryColor }}>{item.value}</p>
              <p className="text-sm text-gray-600 font-medium">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
