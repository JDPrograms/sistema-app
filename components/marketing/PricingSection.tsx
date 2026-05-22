"use client";
import { useState } from "react";

interface Plan {
  name: string;
  price: string;
  period: string;
  desc: string;
  features: string[];
  highlight: boolean;
}

interface Props {
  plans: Plan[];
  popular: string;
  ctaLabel: string;
  locale: string;
}

const LABELS = {
  es: {
    title: "Solicitar plan",
    name: "Nombre completo *",
    email: "Correo electrónico *",
    phone: "Teléfono",
    business: "Nombre del negocio *",
    message: "Mensaje (opcional)",
    namePh: "Juan García",
    emailPh: "juan@ejemplo.com",
    phonePh: "+1 809 000 0000",
    businessPh: "Barbería El Estilo",
    messagePh: "Cuéntanos un poco sobre tu negocio...",
    send: "Enviar solicitud",
    sending: "Enviando...",
    cancel: "Cancelar",
    success: "¡Solicitud enviada! El equipo se pondrá en contacto contigo a la brevedad.",
    error: "Hubo un error al enviar. Inténtalo nuevamente.",
    required: "Por favor completa todos los campos requeridos.",
  },
  en: {
    title: "Request plan",
    name: "Full name *",
    email: "Email address *",
    phone: "Phone",
    business: "Business name *",
    message: "Message (optional)",
    namePh: "John Smith",
    emailPh: "john@example.com",
    phonePh: "+1 809 000 0000",
    businessPh: "The Style Barbershop",
    messagePh: "Tell us a bit about your business...",
    send: "Send request",
    sending: "Sending...",
    cancel: "Cancel",
    success: "Request sent! Our team will get in touch with you shortly.",
    error: "Something went wrong. Please try again.",
    required: "Please fill in all required fields.",
  },
};

export default function PricingSection({ plans, popular, ctaLabel, locale }: Props) {
  const l = LABELS[locale as "es" | "en"] ?? LABELS.es;

  const [selected, setSelected] = useState<Plan | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", business: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [validationError, setValidationError] = useState(false);

  function openModal(plan: Plan) {
    setSelected(plan);
    setStatus("idle");
    setValidationError(false);
  }

  function closeModal() {
    setSelected(null);
    setStatus("idle");
    setValidationError(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.business.trim()) {
      setValidationError(true);
      return;
    }
    setValidationError(false);
    setStatus("sending");

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, plan: selected?.name }),
    });

    setStatus(res.ok ? "sent" : "error");
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-start">
        {plans.map((plan) => (
          <div key={plan.name}
            className={`relative rounded-2xl border-2 p-8 bg-white dark:bg-slate-950 transition-shadow ${
              plan.highlight
                ? "border-blue-500 shadow-2xl shadow-blue-500/10"
                : "border-gray-200 dark:border-slate-700"
            }`}>
            {plan.highlight && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                {popular}
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
            <button
              onClick={() => openModal(plan)}
              className={`block w-full text-center py-3 rounded-xl font-semibold transition-all text-sm ${
                plan.highlight
                  ? "bg-blue-500 hover:bg-blue-400 text-white"
                  : "border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800"
              }`}>
              {ctaLabel}
            </button>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />

          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-7 z-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{l.title}</h2>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                  {locale === "es" ? "Plan seleccionado:" : "Selected plan:"}
                  {" "}
                  <span className="font-semibold text-blue-600">{selected.name} — {selected.price}{selected.period}</span>
                </p>
              </div>
              <button onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-xl leading-none">
                ×
              </button>
            </div>

            {status === "sent" ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-gray-700 dark:text-slate-300 text-sm leading-relaxed">{l.success}</p>
                <button onClick={closeModal}
                  className="mt-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors">
                  {locale === "es" ? "Cerrar" : "Close"}
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">{l.name}</label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder={l.namePh}
                      className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">{l.email}</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                      placeholder={l.emailPh}
                      className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">{l.phone}</label>
                    <input
                      value={form.phone}
                      onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                      placeholder={l.phonePh}
                      className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">{l.business}</label>
                    <input
                      value={form.business}
                      onChange={(e) => setForm((p) => ({ ...p, business: e.target.value }))}
                      placeholder={l.businessPh}
                      className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">{l.message}</label>
                    <textarea
                      value={form.message}
                      onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                      placeholder={l.messagePh}
                      rows={3}
                      className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 dark:text-white resize-none"
                    />
                  </div>
                </div>

                {validationError && (
                  <p className="text-xs text-red-600">{l.required}</p>
                )}
                {status === "error" && (
                  <p className="text-xs text-red-600">{l.error}</p>
                )}

                <div className="flex gap-3 pt-1">
                  <button type="submit" disabled={status === "sending"}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                    {status === "sending" ? l.sending : l.send}
                  </button>
                  <button type="button" onClick={closeModal}
                    className="px-4 py-2.5 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl text-sm transition-colors">
                    {l.cancel}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
