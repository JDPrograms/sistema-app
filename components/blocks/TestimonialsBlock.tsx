interface TestimonialItem { text: string; author: string; role?: string; }
interface TestimonialsConfig { title?: string; items: TestimonialItem[]; }

export default function TestimonialsBlock({ config, primaryColor }: { config: TestimonialsConfig; primaryColor: string }) {
  if (!config.items?.length) return null;
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        {config.title && (
          <h2 className="text-3xl font-bold text-center mb-10 text-gray-900">{config.title}</h2>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {config.items.map((item, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <p className="text-2xl mb-3" style={{ color: primaryColor }}>"</p>
              <p className="text-gray-700 text-sm leading-relaxed mb-5 italic">"{item.text}"</p>
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ backgroundColor: primaryColor }}>
                  {item.author[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{item.author}</p>
                  {item.role && <p className="text-xs text-gray-400">{item.role}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
