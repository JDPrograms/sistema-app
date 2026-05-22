import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import MarketingNav from "@/components/marketing/MarketingNav";

export default async function Home() {
  const session = await auth();
  if (session) {
    const role = (session.user as any).role;
    if (role === "superadmin") redirect("/admin");
    if (role === "siteadmin") redirect(`/site/${(session.user as any).siteSlug}/admin`);
    if (role === "siteuser") redirect(`/site/${(session.user as any).siteSlug}`);
  }

  const locale = await getLocale();
  const t      = await getTranslations();

  const FEATURES  = t.raw("features.items") as { icon: string; title: string; desc: string }[];
  const TEMPLATES = t.raw("templates.items") as { emoji: string; name: string; desc: string }[];
  const PLANS     = t.raw("pricing.plans")  as { name: string; price: string; period: string; desc: string; features: string[]; cta: string; highlight: boolean }[];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100">
      <MarketingNav locale={locale} t={{ features: t("nav.features"), templates: t("nav.templates"), pricing: t("nav.pricing"), login: t("nav.login"), start: t("nav.start"), directory: t("footer.directory") }} />

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white pt-32 pb-24 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(59,130,246,0.15),transparent)]" />
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-400/30 rounded-full px-4 py-1.5 text-sm text-blue-300 mb-6">
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse inline-block" />
            {t("hero.badge")}
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold leading-tight mb-6 tracking-tight">
            {t("hero.title1")}
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              {t("hero.title2")}
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            {t("hero.subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/login"
              className="w-full sm:w-auto px-8 py-4 bg-blue-500 hover:bg-blue-400 rounded-2xl font-bold text-lg transition-all hover:scale-105 shadow-lg shadow-blue-500/30 text-center">
              {t("hero.cta_primary")}
            </Link>
            <a href="#caracteristicas"
              className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl font-semibold text-lg transition-all backdrop-blur-sm text-center">
              {t("hero.cta_secondary")}
            </a>
          </div>
          <p className="text-slate-400 text-sm mt-5">{t("hero.note")}</p>
        </div>

        {/* Dashboard mockup */}
        <div className="relative max-w-3xl mx-auto mt-16 px-4">
          <div className="bg-slate-800/60 backdrop-blur border border-slate-700/50 rounded-2xl p-5 shadow-2xl shadow-black/50">
            <div className="flex gap-1.5 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-400/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
              <div className="w-3 h-3 rounded-full bg-green-400/80" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Citas hoy", val: "12", color: "from-blue-500/20 to-blue-600/10 border-blue-500/30" },
                { label: "Ingresos mes", val: "$2,840", color: "from-green-500/20 to-green-600/10 border-green-500/30" },
                { label: "Clientes", val: "342", color: "from-purple-500/20 to-purple-600/10 border-purple-500/30" },
                { label: "Calificación", val: "4.9 ★", color: "from-amber-500/20 to-amber-600/10 border-amber-500/30" },
              ].map((stat) => (
                <div key={stat.label}
                  className={`bg-gradient-to-br ${stat.color} border rounded-xl p-3`}>
                  <div className="font-bold text-white text-xl">{stat.val}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 h-12 bg-slate-700/40 rounded-xl flex items-center px-4 gap-3">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <div className="text-xs text-slate-400">Juan García — Corte + Barba — Hoy 2:30 pm</div>
              <div className="ml-auto text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/30">Confirmada</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────────── */}
      <section className="bg-slate-50 dark:bg-slate-900 border-y border-gray-100 dark:border-slate-800 py-10 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { num: "500+", label: "Negocios activos" },
            { num: "25K+", label: "Citas gestionadas" },
            { num: "17", label: "Plantillas de diseño" },
            { num: "99.9%", label: "Disponibilidad" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{s.num}</div>
              <div className="text-sm text-gray-500 dark:text-slate-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────── */}
      <section id="caracteristicas" className="py-24 px-4 bg-white dark:bg-slate-950">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">{t("features.title")}</h2>
            <p className="text-gray-500 dark:text-slate-400 text-lg max-w-xl mx-auto">
              {t("features.subtitle")}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title}
                className="bg-slate-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-6 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-md transition-all">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">{t("how.title")}</h2>
            <p className="text-gray-500 dark:text-slate-400 text-lg">
              {t("how.subtitle")}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {(t.raw("how.steps") as { n: string; icon: string; title: string; desc: string }[]).map((s) => (
              <div key={s.n} className="text-center">
                <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/40 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">
                  {s.icon}
                </div>
                <div className="text-xs font-bold text-blue-500 tracking-widest uppercase mb-1">{s.n}</div>
                <h3 className="font-bold text-lg mb-2">{s.title}</h3>
                <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEMPLATES ─────────────────────────────────────────────── */}
      <section id="plantillas" className="py-24 px-4 bg-white dark:bg-slate-950">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">{t("templates.title")}</h2>
            <p className="text-gray-500 dark:text-slate-400 text-lg max-w-xl mx-auto">
              {t("templates.subtitle")}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {TEMPLATES.map((t) => (
              <div key={t.name}
                className="group border border-gray-100 dark:border-slate-800 rounded-2xl p-6 hover:border-blue-200 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all cursor-default">
                <div className="text-4xl mb-3">{t.emoji}</div>
                <h3 className="font-bold text-base mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {t.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">{t.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-400 dark:text-slate-500 mt-8">
            {t("templates.more")}
          </p>
        </div>
      </section>

      {/* ── PRICING ───────────────────────────────────────────────── */}
      <section id="precios" className="py-24 px-4 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">{t("pricing.title")}</h2>
            <p className="text-gray-500 dark:text-slate-400 text-lg">
              {t("pricing.subtitle")}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-start">
            {PLANS.map((plan) => (
              <div key={plan.name}
                className={`relative rounded-2xl border-2 p-8 bg-white dark:bg-slate-950 transition-shadow ${
                  plan.highlight
                    ? "border-blue-500 shadow-2xl shadow-blue-500/10"
                    : "border-gray-200 dark:border-slate-700"
                }`}>
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                    {t("pricing.popular")}
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="font-bold text-lg mb-1">{plan.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">{plan.desc}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold">{plan.price}</span>
                    <span className="text-gray-400 text-sm">{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-2.5 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <span className="text-green-500 font-bold flex-shrink-0">✓</span>
                      <span className="text-gray-700 dark:text-slate-300">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/login"
                  className={`block text-center py-3 rounded-xl font-semibold transition-all text-sm ${
                    plan.highlight
                      ? "bg-blue-500 hover:bg-blue-400 text-white"
                      : "border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800"
                  }`}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-gradient-to-br from-blue-600 to-blue-700 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">{t("cta.title")}</h2>
          <p className="text-blue-100 text-lg mb-8 leading-relaxed">
            {t("cta.subtitle")}
          </p>
          <Link href="/login"
            className="inline-flex items-center gap-2 bg-white text-blue-600 hover:bg-blue-50 font-bold px-10 py-4 rounded-2xl text-lg transition-all hover:scale-105 shadow-lg">
            {t("cta.button")}
          </Link>
          <p className="text-blue-200 text-sm mt-4">{t("cta.note")}</p>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">S</div>
                <span className="font-bold text-white">Sistema de Sistemas</span>
              </div>
              <p className="text-sm max-w-xs leading-relaxed">{t("footer.tagline")}</p>
            </div>
            <div className="flex gap-12 text-sm">
              <div>
                <p className="font-semibold text-white mb-3">{t("footer.product")}</p>
                <ul className="space-y-2">
                  <li><a href="#caracteristicas" className="hover:text-white transition-colors">{t("nav.features")}</a></li>
                  <li><a href="#plantillas" className="hover:text-white transition-colors">{t("nav.templates")}</a></li>
                  <li><a href="#precios" className="hover:text-white transition-colors">{t("nav.pricing")}</a></li>
                  <li><Link href="/directorio" className="hover:text-white transition-colors">{t("footer.directory")}</Link></li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-white mb-3">{t("footer.access")}</p>
                <ul className="space-y-2">
                  <li><Link href="/login" className="hover:text-white transition-colors">{t("nav.login")}</Link></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-6 text-sm text-center">
            © {new Date().getFullYear()} Sistema de Sistemas. {t("footer.copyright")}
          </div>
        </div>
      </footer>
    </div>
  );
}
