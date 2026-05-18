interface PricingPlan {
  name: string;
  price: string;
  period?: string;
  features: string[];
  ctaText?: string;
  ctaUrl?: string;
  highlight?: boolean;
}
interface PricingConfig { title?: string; subtitle?: string; plans: PricingPlan[]; }

export default function PricingBlock({ config, primaryColor }: { config: PricingConfig; primaryColor: string }) {
  if (!config.plans?.length) return null;
  return (
    <section className="py-16 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        {config.title && <h2 className="text-3xl font-bold text-center mb-3 text-gray-900">{config.title}</h2>}
        {config.subtitle && <p className="text-center text-gray-500 mb-10">{config.subtitle}</p>}
        <div className={`grid gap-6 ${config.plans.length === 1 ? "max-w-sm mx-auto" : config.plans.length === 2 ? "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
          {config.plans.map((plan, i) => (
            <div key={i} className={`rounded-2xl border-2 p-6 flex flex-col ${plan.highlight ? "shadow-xl scale-105" : "border-gray-100"}`}
              style={plan.highlight ? { borderColor: primaryColor } : {}}>
              {plan.highlight && (
                <div className="text-xs font-bold text-white px-3 py-1 rounded-full mb-4 self-start"
                  style={{ backgroundColor: primaryColor }}>
                  Popular
                </div>
              )}
              <p className="font-bold text-lg text-gray-900 mb-1">{plan.name}</p>
              <div className="flex items-end gap-1 mb-4">
                <span className="text-4xl font-extrabold" style={{ color: primaryColor }}>{plan.price}</span>
                {plan.period && <span className="text-gray-400 text-sm mb-1">/{plan.period}</span>}
              </div>
              <ul className="space-y-2 flex-1 mb-6">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="mt-0.5 font-bold flex-shrink-0" style={{ color: primaryColor }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              {plan.ctaText && (
                <a href={plan.ctaUrl || "#"}
                  className={`block text-center py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 ${plan.highlight ? "text-white" : "border-2"}`}
                  style={plan.highlight ? { backgroundColor: primaryColor } : { borderColor: primaryColor, color: primaryColor }}>
                  {plan.ctaText}
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
