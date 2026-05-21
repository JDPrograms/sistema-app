"use client";
import { useState, useEffect } from "react";

interface Service { id: string; name: string; price?: number | null; duration?: number | null }
interface StaffMember { id: string; name: string; specialty?: string | null }
interface SlotInfo { time: string; available: boolean }

interface Props {
  slug: string;
  siteName: string;
  primaryColor: string;
  services: Service[];
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function hashColor(str: string) {
  const palette = ["#3b82f6","#8b5cf6","#ec4899","#f59e0b","#10b981","#06b6d4","#f97316","#6366f1"];
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) & 0xffffffff;
  return palette[Math.abs(h) % palette.length];
}

export default function BookingForm({ slug, siteName, primaryColor, services }: Props) {
  const [form, setForm] = useState({
    clientName: "", clientEmail: "", clientPhone: "",
    serviceId: "", date: "", time: "", notes: "",
  });
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null); // null = not chosen yet, "" = sin preferencia
  const [staffList, setStaffList]   = useState<StaffMember[]>([]);
  const [slots, setSlots]           = useState<SlotInfo[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [status, setStatus]         = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg]     = useState("");

  const today = new Date().toISOString().split("T")[0];

  // Fetch active staff once on mount
  useEffect(() => {
    fetch(`/api/site/${slug}/booking/staff`)
      .then((r) => r.json())
      .then((d) => setStaffList(d.staff ?? []))
      .catch(() => {});
  }, [slug]);

  // Fetch available time slots when date or staff changes
  useEffect(() => {
    if (!form.date || selectedStaffId === null) return;
    setLoadingSlots(true);
    setForm((p) => ({ ...p, time: "" }));
    const params = new URLSearchParams({ date: form.date });
    if (selectedStaffId) params.set("staffId", selectedStaffId);
    fetch(`/api/site/${slug}/booking/slots?${params}`)
      .then((r) => r.json())
      .then((d) => setSlots(d.slots ?? []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [form.date, selectedStaffId, slug]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (staffList.length > 0 && selectedStaffId === null) {
      setErrorMsg("Por favor elige un profesional o selecciona «Sin preferencia».");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setErrorMsg("");
    const res = await fetch(`/api/site/${slug}/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, ...(selectedStaffId ? { staffId: selectedStaffId } : {}) }),
    });
    if (res.ok) {
      setStatus("success");
      setForm({ clientName: "", clientEmail: "", clientPhone: "", serviceId: "", date: "", time: "", notes: "" });
      setSelectedStaffId(null);
      setSlots([]);
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
          style={{ backgroundColor: `${primaryColor}20` }}>✅</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">¡Cita reservada!</h3>
        <p className="text-gray-500 mb-6">Te contactaremos para confirmar tu cita. Revisa tu email.</p>
        <button onClick={() => setStatus("idle")}
          className="px-6 py-2.5 rounded-xl font-semibold text-white text-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: primaryColor }}>
          Reservar otra cita
        </button>
      </div>
    );
  }

  const hasStaff = staffList.length > 0;
  const staffChosen = selectedStaffId !== null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── Datos personales ─────────────────────────────────────── */}
      <section>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Tus datos</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
            <input name="clientName" value={form.clientName} onChange={handleChange} required
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 transition-shadow"
              style={{ "--tw-ring-color": primaryColor } as any}
              placeholder="Juan García" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input name="clientPhone" value={form.clientPhone} onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 transition-shadow"
              placeholder="+1 809 555 0000" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input type="email" name="clientEmail" value={form.clientEmail} onChange={handleChange} required
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 transition-shadow"
              placeholder="correo@ejemplo.com" />
          </div>
        </div>
      </section>

      {/* ── Servicio ─────────────────────────────────────────────── */}
      {services.length > 0 && (
        <section>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Servicio</p>
          <select name="serviceId" value={form.serviceId} onChange={handleChange}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 transition-shadow">
            <option value="">-- Sin servicio específico --</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}{s.price != null ? ` — $${s.price.toFixed(2)}` : ""}{s.duration ? ` (${s.duration} min)` : ""}
              </option>
            ))}
          </select>
        </section>
      )}

      {/* ── Selección de profesional ─────────────────────────────── */}
      {hasStaff && (
        <section>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Profesional</p>
          <div className="flex flex-wrap gap-3">
            {/* Sin preferencia */}
            <button type="button"
              onClick={() => setSelectedStaffId("")}
              className={[
                "flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl border-2 transition-all text-center min-w-[80px]",
                selectedStaffId === ""
                  ? "border-current text-white"
                  : "border-gray-200 text-gray-600 hover:border-gray-300 bg-white",
              ].join(" ")}
              style={selectedStaffId === "" ? { borderColor: primaryColor, backgroundColor: primaryColor } : {}}>
              <span className="text-2xl leading-none">🎲</span>
              <span className="text-xs font-medium leading-tight">Sin<br/>preferencia</span>
            </button>

            {/* Staff cards */}
            {staffList.map((member) => {
              const color = hashColor(member.id);
              const active = selectedStaffId === member.id;
              return (
                <button key={member.id} type="button"
                  onClick={() => setSelectedStaffId(member.id)}
                  className={[
                    "flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl border-2 transition-all text-center min-w-[80px] max-w-[110px]",
                    active ? "border-current" : "border-gray-200 hover:border-gray-300 bg-white",
                  ].join(" ")}
                  style={active ? { borderColor: color, backgroundColor: `${color}12` } : {}}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ backgroundColor: color }}>
                    {initials(member.name)}
                  </div>
                  <span className="text-xs font-semibold text-gray-800 leading-tight line-clamp-2">{member.name}</span>
                  {member.specialty && (
                    <span className="text-[10px] text-gray-400 leading-tight line-clamp-1">{member.specialty}</span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Fecha y hora ─────────────────────────────────────────── */}
      {(!hasStaff || staffChosen) && (
        <section>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Fecha y hora</p>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
            <input type="date" name="date" value={form.date} onChange={handleChange}
              min={today} required
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 transition-shadow"
              style={{ "--tw-ring-color": primaryColor } as any} />
          </div>

          {form.date && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hora *</label>
              {loadingSlots ? (
                <div className="flex gap-2 flex-wrap">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="w-16 h-9 rounded-xl bg-gray-100 animate-pulse" />
                  ))}
                </div>
              ) : slots.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No hay horarios disponibles para este día.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {slots.map(({ time, available }) => (
                    <button key={time} type="button"
                      disabled={!available}
                      onClick={() => available && setForm((p) => ({ ...p, time }))}
                      className={[
                        "px-3 py-2 rounded-xl text-sm font-medium border-2 transition-all",
                        !available
                          ? "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed line-through"
                          : form.time === time
                            ? "border-current text-white"
                            : "border-gray-200 text-gray-700 bg-white hover:border-gray-300",
                      ].join(" ")}
                      style={available && form.time === time
                        ? { borderColor: primaryColor, backgroundColor: primaryColor }
                        : {}}>
                      {time}
                    </button>
                  ))}
                </div>
              )}
              {/* Hidden required input so browser validation catches missing time */}
              <input type="hidden" name="time" value={form.time} required />
              {form.date && !form.time && (
                <p className="text-xs text-gray-400 mt-2">Selecciona una hora para continuar.</p>
              )}
            </div>
          )}
        </section>
      )}

      {/* ── Notas ────────────────────────────────────────────────── */}
      {(!hasStaff || staffChosen) && form.time && (
        <section>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Notas adicionales</p>
          <textarea name="notes" value={form.notes} onChange={handleChange} rows={3}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 transition-shadow resize-none"
            style={{ "--tw-ring-color": primaryColor } as any}
            placeholder="Algún detalle especial, preferencia o consulta..." />
        </section>
      )}

      {status === "error" && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{errorMsg}</div>
      )}

      <button type="submit"
        disabled={status === "loading" || !form.time || (hasStaff && !staffChosen)}
        className="w-full py-3 rounded-xl font-bold text-white text-sm transition-opacity hover:opacity-90 disabled:opacity-40"
        style={{ backgroundColor: primaryColor }}>
        {status === "loading" ? "Reservando..." : "Confirmar cita"}
      </button>
    </form>
  );
}
