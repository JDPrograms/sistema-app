interface VideoConfig { title?: string; url: string; caption?: string; }

function getEmbedUrl(url: string): string | null {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  if (url.includes("youtube.com/embed") || url.includes("player.vimeo.com")) return url;
  return null;
}

export default function VideoBlock({ config, primaryColor }: { config: VideoConfig; primaryColor: string }) {
  const embedUrl = getEmbedUrl(config.url);
  if (!embedUrl) return null;
  return (
    <section className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-6">
        {config.title && <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">{config.title}</h2>}
        <div className="relative rounded-2xl overflow-hidden shadow-lg" style={{ paddingTop: "56.25%" }}>
          <iframe
            src={embedUrl}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        {config.caption && <p className="text-center text-gray-500 text-sm mt-4">{config.caption}</p>}
      </div>
    </section>
  );
}
