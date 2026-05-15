interface CtaConfig { title: string; subtitle?: string; buttonText: string; buttonUrl?: string; }

export default function CtaBlock({ config, primaryColor, secondaryColor }: { config: CtaConfig; primaryColor: string; secondaryColor: string }) {
  if (!config.title) return null;
  return (
    <section className="py-20 text-white text-center"
      style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="text-4xl font-extrabold mb-4">{config.title}</h2>
        {config.subtitle && <p className="text-lg opacity-85 mb-8">{config.subtitle}</p>}
        {config.buttonText && (
          <a href={config.buttonUrl || "#"} target={config.buttonUrl?.startsWith("http") ? "_blank" : undefined}
            rel="noopener noreferrer"
            className="inline-block bg-white font-bold px-10 py-4 rounded-full text-sm transition-opacity hover:opacity-90"
            style={{ color: primaryColor }}>
            {config.buttonText}
          </a>
        )}
      </div>
    </section>
  );
}
