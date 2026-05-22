"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface PlanRequest {
  id: string;
  plan: string;
  status: string;
  message: string | null;
  adminNote: string | null;
  createdAt: string;
}

const PLANS = [
  {
    id: "free",
    name: "Básico",
    price: "Gratis",
    period: "",
    desc: "Para empezar tu negocio digital",
    features: ["1 sitio web", "50 citas / mes", "100 productos", "Chat con clientes", "Plantillas incluidas"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$29",
    period: "/mes",
    desc: "Para negocios en crecimiento",
    features: ["Sitios ilimitados", "Citas ilimitadas", "Productos ilimitados", "Email marketing", "Reportes avanzados", "Soporte prioritario"],
    highlight: true,
  },
  {
    id: "enterprise",
    name: "Empresa",
    price: "A convenir",
    period: "",
    desc: "Para operaciones a gran escala",
    features: ["Todo lo del plan Pro", "White-label", "API personalizada", "Integraciones avanzadas", "SLA garantizado", "Gestor de cuenta dedicado"],
  },
];

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  pending:  { label: "Pendiente",  color: "bg-amber-100 text-amber-700" },
  approved: { label: "Aprobada",   color: "bg-green-100 text-green-700" },
  rejected: { label: "Rechazada",  color: "bg-red-100 text-red-600" },
};

const PLAN_LABELS: Record<string, string> = { pro: "Pro", enterprise: "Empresa" };

export default function SubscriptionPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [requests, setRequests] = useState<PlanRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/site/${slug}/plan-request`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setRequests(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  const hasPending = requests.some((r) => r.status === "pending");

  async function submit() {
    if (!selectedPlan) return;
    setSending(true);
    setError(null);
    const res = await fetch(`/api/site/${slug}/plan-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: selectedPlan, message }),
    });
    const data = await res.json();
    setSending(false);
    if (!res.ok) {
      setError(data.error ?? "Error al enviar la solicitud");
    } else {
      setSent(true);
      setSelectedPlan(null);
      setMessage("");
      setRequests((prev) => [data, ...prev]);
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Planes</h1>
      <p className="text-gray-500 mb-8">Solicita un cambio de plan y el equipo se pondrá en contacto contigo.</p>

      {sent && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 text-green-700 text-sm font-medium">
          ✓ Solicitud enviada. El equipo revisará tu solicitud y te contactará a la brevedad.
        </div>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            onClick={() => plan.id !== "free" && !hasPending && setSelectedPlan(plan.id === selectedPlan ? null : plan.id)}
            className={`relative bg-white rounded-2xl border-2 p-6 transition-all ${
              plan.id === "free"
                ? "border-gray-200 opacity-70 cursor-default"
                : hasPending
                  ? "border-gray-200 cursor-not-allowed opacity-60"
                  : selectedPlan === plan.id
                    ? "border-blue-500 shadow-xl shadow-blue-500/10 cursor-pointer"
                    : "border-gray-200 hover:border-blue-300 cursor-pointer hover:shadow-md"
            }`}
          >
            {(plan as any).highlight && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                RECOMENDADO
              </div>
            )}
            {selectedPlan === plan.id && (
              <div className="absolute top-3 right-3 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            <h3 className="font-bold text-lg mb-1">{plan.name}</h3>
            <p className="text-xs text-gray-400 mb-3">{plan.desc}</p>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-3xl font-extrabold">{plan.price}</span>
              <span className="text-gray-400 text-sm">{plan.period}</span>
            </div>
            <ul className="space-y-1.5">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-500 font-bold flex-shrink-0">✓</span> {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Request form */}
      {selectedPlan && !hasPending && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 max-w-xl mb-8">
          <h2 className="font-semibold text-gray-900 mb-1">
            Solicitar plan <span className="text-blue-600">{PLAN_LABELS[selectedPlan]}</span>
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            El equipo revisará tu solicitud y se pondrá en contacto contigo para coordinar el acceso.
          </p>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="(Opcional) Cuéntanos más sobre tu negocio o lo que necesitas..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none mb-3"
          />
          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
          <div className="flex gap-3">
            <button
              onClick={submit}
              disabled={sending}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
            >
              {sending ? "Enviando..." : "Enviar solicitud"}
            </button>
            <button
              onClick={() => { setSelectedPlan(null); setError(null); }}
              className="border border-gray-200 text-gray-600 hover:bg-gray-50 px-4 py-2.5 rounded-xl text-sm transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {hasPending && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-700 text-sm max-w-xl mb-8">
          Ya tienes una solicitud pendiente. El equipo se pondrá en contacto contigo a la brevedad.
        </div>
      )}

      {/* Request history */}
      {!loading && requests.length > 0 && (
        <div className="max-w-xl">
          <h2 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Historial de solicitudes</h2>
          <div className="space-y-3">
            {requests.map((r) => {
              const badge = STATUS_BADGE[r.status] ?? STATUS_BADGE.pending;
              return (
                <div key={r.id} className="bg-white border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900">Plan {PLAN_LABELS[r.plan] ?? r.plan}</span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${badge.color}`}>{badge.label}</span>
                  </div>
                  {r.message && <p className="text-sm text-gray-500 mb-1">{r.message}</p>}
                  {r.adminNote && (
                    <p className="text-sm text-blue-700 bg-blue-50 rounded-lg px-3 py-2 mt-2">
                      💬 {r.adminNote}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(r.createdAt).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
