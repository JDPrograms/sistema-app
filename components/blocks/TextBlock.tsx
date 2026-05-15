interface TextConfig { title?: string; body: string; align?: "left" | "center"; }

export default function TextBlock({ config, primaryColor }: { config: TextConfig; primaryColor: string }) {
  if (!config.body) return null;
  const align = config.align === "left" ? "text-left" : "text-center";
  return (
    <section className="py-16 bg-white">
      <div className={`max-w-3xl mx-auto px-6 ${align}`}>
        {config.title && (
          <h2 className="text-3xl font-bold mb-6 text-gray-900">{config.title}</h2>
        )}
        <div className="text-gray-600 leading-relaxed whitespace-pre-line text-base">{config.body}</div>
      </div>
    </section>
  );
}
