"use client";
import { useState } from "react";

interface Service { id: string; name: string; price?: number | null; duration?: number | null }

interface Props {
  slug: string;
  siteName: string;
  primaryColor: string;
  services: Service[];
}

const timeSlots = [
  "08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30",
  "12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30",
  "16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30",
];

export default function BookingForm({ slug, siteName, primaryColor, services }: Props) {
  const [form, setForm] = useState({
    clientName: "", clientEmail: "", clientPhone: "",
    serviceId: "", date: "", time: "", notes: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const today = new Date().toISOString().split("T")[0];

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    const res = await fetch(`/api/site/${slug}/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setStatus("success");
      setForm({ clientName: "", clientEmail: "", clientPhone: "", serviceId: "", date: "", time: "", notes: "" });
    } else {
      const data = await res.json();
      setErrorMsg(data.error || "Error al reservar. Intenta de nuevo.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="text-center py-10 px-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl"
          style={{ backgroundColor: `${primaryColor}20` }}>
          ✅
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Cita reservada</h3>
        <p className="text-gray-500 mb-6">Te contactaremos para confirmar tu cita. Revisa tu email.</p>
        <button onClick={() => setStatus("idle")}
          className="px-6 py-2.5 rounded-xl font-semibold text-white text-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: primaryColor }}>
          Reservar otra cita
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
          <input name="clientName" value={form.clientName} onChange={handleChange} required
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 bg-white focus:outline-none focus:ring-2 transition-shadow"
            style={{ "--tw-ring-color": primaryColor } as any}
            placeholder="Juan Garcia" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
          <input name="clientPhone" value={form.clientPhone} onChange={handleChange}
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 bg-white focus:outline-none focus:ring-2 transition-shadow"
            placeholder="+1 234 567 8900" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input type="email" name="clientEmail" value={form.clientEmail} onChange={handleChange} required
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 bg-white focus:outline-none focus:ring-2 transition-shadow"
            placeholder="correo@ejemplo.com" />
        </div>
      </div>

      {services.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Servicio</label>
          <select name="serviceId" value={form.serviceId} onChange={handleChange}
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 bg-white focus:outline-none focus:ring-2 transition-shadow">
            <option value="">-- Sin servicio especifico --</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}{s.price != null ? ` — $${s.price.toFixed(2)}` : ""}{s.duration ? ` (${s.duration} min)` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
          <input type="date" name="date" value={form.date} onChange={handleChange}
            min={today} required
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 bg-white focus:outline-none focus:ring-2 transition-shadow" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hora *</label>
          <select name="time" value={form.time} onChange={handleChange} required
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 bg-white focus:outline-none focus:ring-2 transition-shadow">
            <option value="">-- Selecciona --</option>
            {timeSlots.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notas adicionales</label>
        <textarea name="notes" value={form.notes} onChange={handleChange} rows={3}
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 bg-white focus:outline-none focus:ring-2 transition-shadow resize-none"
          placeholder="Algun detalle especial, preferencia o consulta..." />
      </div>

      {status === "error" && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{errorMsg}</div>
      )}

      <button type="submit" disabled={status === "loading"}
        className="w-full py-3 rounded-xl font-bold text-white text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: primaryColor }}>
        {status === "loading" ? "Reservando..." : "Confirmar cita"}
      </button>
    </form>
  );
}
