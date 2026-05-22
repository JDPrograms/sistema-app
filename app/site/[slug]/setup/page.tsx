"use client";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";

type Step = 1 | 2 | 3 | 4;

interface Service { name: string; price: string; duration: string }
interface Staff   { name: string; specialty: string }

const STEP_LABELS = ["Tu negocio", "Servicios", "Personal", "Listo"];
const STEP_ICONS  = ["🏢", "🛍️", "👤", "🚀"];

export default function SetupPage() {
  const router = useRouter();
  const params = useParams() as { slug: string };
  const slug   = params.slug;

  const [step,    setStep]    = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const [info, setInfo] = useState({ name: "", description: "", phone: "", address: "" });
  const [services, setServices] = useState<Service[]>([{ name: "", price: "", duration: "" }]);
  const [staff, setStaff] = useState<Staff[]>([{ name: "", specialty: "" }]);
  const [skipStaff, setSkipStaff] = useState(false);

  function addService() { setServices((p) => [...p, { name: "", price: "", duration: "" }]); }
  function removeService(i: number) { setServices((p) => p.filter((_, idx) => idx !== i)); }
  function updateService(i: number, field: keyof Service, val: string) {
    setServices((p) => p.map((s, idx) => (idx === i ? { ...s, [field]: val } : s)));
  }

  function addStaff() { setStaff((p) => [...p, { name: "", specialty: "" }]); }
  function removeStaff(i: number) { setStaff((p) => p.filter((_, idx) => idx !== i)); }
  function updateStaff(i: number, field: keyof Staff, val: string) {
    setStaff((p) => p.map((s, idx) => (idx === i ? { ...s, [field]: val } : s)));
  }

  async function submitInfo() {
    if (!info.name.trim()) { setError("El nombre del negocio es obligatorio."); return; }
    setError(""); setLoading(true);

    const body: Record<string, string> = { name: info.name };
    if (info.description) body.description = info.description;
    if (info.phone)       body.phone       = info.phone;
    if (info.address)     body.address     = info.address;

    const res = await fetch(`/api/site/${slug}/customize`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (res.ok) setStep(2);
    else setError("Error al guardar. Intenta de nuevo.");
  }

  async function submitServices() {
    const valid = services.filter((s) => s.name.trim());
    if (!valid.length) { setError("Agrega al menos un servicio."); return; }
    setError(""); setLoading(true);

    for (const svc of valid) {
      await fetch(`/api/site/${slug}/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:     svc.name,
          price:    svc.price ? parseFloat(svc.price) : null,
          duration: svc.duration ? parseInt(svc.duration) : null,
        }),
      });
    }
    setLoading(false);
    setStep(3);
  }

  async function submitStaff() {
    if (!skipStaff) {
      const valid = staff.filter((s) => s.name.trim());
      if (valid.length) {
        setLoading(true);
        for (const member of valid) {
          await fetch(`/api/site/${slug}/staff`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: member.name, specialty: member.specialty || null }),
          });
        }
        setLoading(false);
      }
    }
    setStep(4);
  }

  async function complete() {
    setLoading(true);
    await fetch(`/api/site/${slug}/onboarding`, { method: "PATCH" });
    router.push(`/site/${slug}/admin`);
  }

  const progress = ((step - 1) / 3) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">

        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">
            {STEP_ICONS[step - 1]}
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
            {step < 4 ? "Configura tu negocio" : "¡Todo listo!"}
          </h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1 text-sm">
            {step < 4 ? `Paso ${step} de 3 — ${STEP_LABELS[step - 1]}` : "Tu sitio está configurado y listo para usar."}
          </p>
        </div>

        {step < 4 && (
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-400 dark:text-slate-500 mb-2">
              {STEP_LABELS.slice(0, 3).map((l, i) => (
                <span key={l} className={i + 1 <= step ? "text-blue-600 dark:text-blue-400 font-semibold" : ""}>{l}</span>
              ))}
            </div>
            <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm">

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Nombre del negocio <span className="text-red-500">*</span>
                </label>
                <input
                  value={info.name}
                  onChange={(e) => setInfo((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Ej: Barbería Don Juan"
                  className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Descripción breve</label>
                <textarea
                  value={info.description}
                  onChange={(e) => setInfo((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                  placeholder="Describe brevemente qué ofrece tu negocio..."
                  className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Teléfono</label>
                  <input
                    value={info.phone}
                    onChange={(e) => setInfo((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="+1 809 555 0000"
                    className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Dirección</label>
                  <input
                    value={info.address}
                    onChange={(e) => setInfo((p) => ({ ...p, address: e.target.value }))}
                    placeholder="Calle 1, Ciudad"
                    className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button onClick={submitInfo} disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors mt-2">
                {loading ? "Guardando..." : "Continuar →"}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Agrega los servicios o productos principales que ofreces.
              </p>
              {services.map((svc, i) => (
                <div key={i} className="bg-slate-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Servicio {i + 1}</span>
                    {services.length > 1 && (
                      <button onClick={() => removeService(i)} className="text-red-400 hover:text-red-500 text-xs transition-colors">Eliminar</button>
                    )}
                  </div>
                  <input
                    value={svc.name}
                    onChange={(e) => updateService(i, "name", e.target.value)}
                    placeholder="Nombre del servicio (ej: Corte de cabello)"
                    className="w-full border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={svc.price}
                      onChange={(e) => updateService(i, "price", e.target.value)}
                      placeholder="Precio (ej: 25)"
                      type="number"
                      min="0"
                      className="border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      value={svc.duration}
                      onChange={(e) => updateService(i, "duration", e.target.value)}
                      placeholder="Duración en min"
                      type="number"
                      min="0"
                      className="border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ))}
              <button onClick={addService}
                className="w-full border-2 border-dashed border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 rounded-xl py-3 text-sm text-gray-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
                + Agregar otro servicio
              </button>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex gap-3 mt-2">
                <button onClick={() => { setError(""); setStep(1); }}
                  className="flex-1 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 font-semibold py-3 rounded-xl text-sm transition-colors">
                  ← Atrás
                </button>
                <button onClick={submitServices} disabled={loading}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
                  {loading ? "Guardando..." : "Continuar →"}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-slate-400">
                ¿Tu negocio tiene varios profesionales o empleados? Agrégalos para que los clientes puedan elegir con quién quieren su cita.
              </p>
              <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-slate-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                <input type="checkbox" checked={skipStaff} onChange={(e) => setSkipStaff(e.target.checked)}
                  className="w-4 h-4 accent-blue-500" />
                <span className="text-sm text-gray-700 dark:text-slate-300">Mi negocio no maneja personal / lo configuro después</span>
              </label>

              {!skipStaff && staff.map((member, i) => (
                <div key={i} className="bg-slate-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Miembro {i + 1}</span>
                    {staff.length > 1 && (
                      <button onClick={() => removeStaff(i)} className="text-red-400 hover:text-red-500 text-xs transition-colors">Eliminar</button>
                    )}
                  </div>
                  <input
                    value={member.name}
                    onChange={(e) => updateStaff(i, "name", e.target.value)}
                    placeholder="Nombre (ej: Carlos Pérez)"
                    className="w-full border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    value={member.specialty}
                    onChange={(e) => updateStaff(i, "specialty", e.target.value)}
                    placeholder="Especialidad (ej: Cortes clásicos)"
                    className="w-full border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}

              {!skipStaff && (
                <button onClick={addStaff}
                  className="w-full border-2 border-dashed border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 rounded-xl py-3 text-sm text-gray-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
                  + Agregar otro miembro
                </button>
              )}

              <div className="flex gap-3 mt-2">
                <button onClick={() => setStep(2)}
                  className="flex-1 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 font-semibold py-3 rounded-xl text-sm transition-colors">
                  ← Atrás
                </button>
                <button onClick={submitStaff} disabled={loading}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
                  {loading ? "Guardando..." : "Continuar →"}
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center py-4 space-y-5">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center text-4xl mx-auto">
                🎉
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">¡Tu negocio está listo!</h2>
                <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                  Configuraste tu información básica, servicios y personal. Ahora puedes empezar a recibir citas y gestionar tu negocio desde el panel.
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 rounded-xl p-4 text-sm text-blue-700 dark:text-blue-300 text-left space-y-1.5">
                <p className="font-semibold mb-2">Próximos pasos sugeridos:</p>
                <p>🎨 Personaliza los colores y logo de tu sitio</p>
                <p>📢 Comparte el enlace de tu negocio con tus clientes</p>
                <p>📅 Configura tus horarios de atención</p>
              </div>
              <button onClick={complete} disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-colors">
                {loading ? "Cargando..." : "Ir a mi panel →"}
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-slate-600 mt-4">
          Puedes cambiar todo esto después desde tu panel de administración.
        </p>
      </div>
    </div>
  );
}
