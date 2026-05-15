"use client";

interface GalleryConfig {
  title?: string;
  images: string[];
}

export default function GalleryBlock({ config, primaryColor }: { config: GalleryConfig; primaryColor: string }) {
  if (!config.images?.length) return null;
  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        {config.title && (
          <h2 className="text-3xl font-bold text-center mb-10 text-gray-900">{config.title}</h2>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {config.images.map((url, i) => (
            <div key={i} className="aspect-square rounded-xl overflow-hidden bg-gray-100 group">
              <img src={url} alt={`Foto ${i + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
