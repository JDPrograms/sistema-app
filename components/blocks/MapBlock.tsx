interface MapConfig { title?: string; embedUrl: string; address?: string; height?: number; }

export default function MapBlock({ config }: { config: MapConfig; primaryColor?: string }) {
  if (!config.embedUrl) return null;
  const h = config.height || 350;
  return (
    <section className="py-16 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        {config.title && <h2 className="text-3xl font-bold text-center mb-4 text-gray-900">{config.title}</h2>}
        {config.address && <p className="text-center text-gray-500 mb-6">{config.address}</p>}
        <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-100" style={{ height: h }}>
          <iframe
            src={config.embedUrl}
            className="w-full h-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </div>
    </section>
  );
}
