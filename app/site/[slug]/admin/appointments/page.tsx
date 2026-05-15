"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";

interface Staff { id: string; name: string; specialty?: string; isActive: boolean }
interface Appointment {
  id: string; clientName: string; clientEmail: string; clientPhone?: string;
  serviceName?: string; staffId?: string; staffName?: string;
  date: string; time: string; notes?: string;
  status: string; createdAt: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: "Pendiente",   color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200" },
  confirmed: { label: "Confirmada",  color: "text-blue-700",   bg: "bg-blue-50 border-blue-200" },
  completed: { label: "Completada",  color: "text-green-700",  bg: "bg-green-50 border-green-200" },
  cancelled: { label: "Cancelada",   color: "text-red-700",    bg: "bg-red-50 border-red-200" },
};

const STATUS_ACTIONS: Record<string, { next: string; label: string }[]> = {
  pending:   [{ next: "confirmed", label: "Confirmar" }, { next: "cancelled", label: "Cancelar" }],
  confirmed: [{ next: "completed", label: "Completar" }, { next: "cancelled", label: "Cancelar" }],
  completed: [],
  cancelled: [{ next: "pending", label: "Reabrir" }],
};

export default function AppointmentsPage() {
  const { slug } = useParams() as { slug: string };
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);
    if (filterDate) params.set("date", filterDate);
    const r = await fetch(`/api/site/${slug}/appointments?${params}`);
    if (r.ok) setAppointments(await r.json());
    setLoading(false);
  }, [slug, filterStatus, filterDate]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    fetch(`/api/site/${slug}/staff`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setStaffList(data); })
      .catch(() => {});
  }, [slug]);

  async function changeStatus(id: string, status: string) {
    setUpdating(id);
    const r = await fetch(`/api/site/${slug}/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (r.ok) {
      const updated = await r.json();
      setAppointments((p) => p.map((a) => a.id === id ? updated : a));
      if (selected?.id === id) setSelected(updated);
    }
    setUpdating(null);
  }

  async function assignStaff(appointmentId: string, staffId: string) {
    const member = staffList.find((s) => s.id === staffId);
    const r = await fetch(`/api/site/${slug}/appointments/${appointmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staffId: staffId || null, staffName: member?.name || null }),
    });
    if (r.ok) {
      const updated = await r.json();
      setAppointments((p) => p.map((a) => a.id === appointmentId ? updated : a));
      if (selected?.id === appointmentId) setSelected(updated);
    }
  }

  async function deleteAppointment(id: string) {
    if (!confirm("Eliminar esta cita permanentemente?")) return;
    await fetch(`/api/site/${slug}/appointments/${id}`, { method: "DELETE" });
    setAppointments((p) => p.filter((a) => a.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  function formatDate(d: string) {
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y}`;
  }

  const counts = Object.keys(STATUS_LABELS).reduce((acc, s) => {
    acc[s] = appointments.filter((a) => a.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  const today = new Date().toISOString().split("T")[0];
  const todayCount = appointments.filter((a) => a.date === today).length;
  const activeStaff = staffList.filter((s) => s.isActive);

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Citas</h1>
        <p className="text-gray-500 mt-1">Gestiona todas las reservas de tu sitio</p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">Total</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{todayCount}</p>
          <p className="text-xs text-gray-400 mt-0.5">Hoy</p>
        </div>
        {Object.entries(STATUS_LABELS).map(([s, { label, color }]) => (
          <div key={s} className="bg-white rounded-xl border border-gray-200 p-4 text-center cursor-pointer hover:border-gray-300 transition-colors"
            onClick={() => setFilterStatus(filterStatus === s ? "" : s)}>
            <p className={`text-2xl font-bold ${color}`}>{counts[s] ?? 0}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_LABELS).map(([s, { label }]) => (
            <option key={s} value={s}>{label}</option>
          ))}
        </select>
        <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        {(filterStatus || filterDate) && (
          <button onClick={() => { setFilterStatus(""); setFilterDate(""); }}
            className="text-sm text-gray-400 hover:text-gray-700 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            Limpiar filtros ×
          </button>
        )}
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Lista */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">Cargando...</div>
          ) : appointments.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
              <p className="text-3xl mb-3">📅</p>
              <p className="text-gray-500 font-medium">No hay citas{filterStatus || filterDate ? " con estos filtros" : " aun"}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {appointments.map((a) => {
                const st = STATUS_LABELS[a.status] ?? STATUS_LABELS.pending;
                const isSelected = selected?.id === a.id;
                return (
                  <div key={a.id}
                    onClick={() => setSelected(isSelected ? null : a)}
                    className={`bg-white rounded-xl border p-4 cursor-pointer transition-all ${isSelected ? "border-blue-400 shadow-sm" : "border-gray-200 hover:border-gray-300"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900">{a.clientName}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${st.bg} ${st.color}`}>
                            {st.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {formatDate(a.date)} a las {a.time}
                          {a.serviceName && <span className="ml-2">· {a.serviceName}</span>}
                        </p>
                        <div className="flex gap-3 text-xs text-gray-400 mt-0.5">
                          <span>{a.clientEmail}{a.clientPhone ? ` · ${a.clientPhone}` : ""}</span>
                          {a.staffName && <span className="text-blue-500">· {a.staffName}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        {STATUS_ACTIONS[a.status]?.map(({ next, label }) => (
                          <button key={next} onClick={() => changeStatus(a.id, next)}
                            disabled={updating === a.id}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 ${
                              next === "confirmed" ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" :
                              next === "completed" ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" :
                              next === "cancelled" ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100" :
                              "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                            }`}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detalle */}
        {selected && (
          <div className="w-80 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Detalle de cita</h3>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Cliente</p>
                  <p className="font-semibold text-gray-900">{selected.clientName}</p>
                  <p className="text-sm text-gray-500">{selected.clientEmail}</p>
                  {selected.clientPhone && <p className="text-sm text-gray-500">{selected.clientPhone}</p>}
                </div>

                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Fecha y hora</p>
                  <p className="font-semibold text-gray-900">{formatDate(selected.date)}</p>
                  <p className="text-sm text-gray-500">{selected.time} hrs</p>
                </div>

                {selected.serviceName && (
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Servicio</p>
                    <p className="font-semibold text-gray-900">{selected.serviceName}</p>
                  </div>
                )}

                {/* Asignacion de personal */}
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Personal asignado</p>
                  {activeStaff.length === 0 ? (
                    <p className="text-sm text-gray-400">No hay personal registrado</p>
                  ) : (
                    <select
                      value={selected.staffId || ""}
                      onChange={(e) => assignStaff(selected.id, e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Sin asignar</option>
                      {activeStaff.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}{s.specialty ? ` — ${s.specialty}` : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {selected.notes && (
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Notas</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selected.notes}</p>
                  </div>
                )}

                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Estado</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${STATUS_LABELS[selected.status]?.bg} ${STATUS_LABELS[selected.status]?.color}`}>
                    {STATUS_LABELS[selected.status]?.label}
                  </span>
                </div>

                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Reservada el</p>
                  <p className="text-sm text-gray-500">{new Date(selected.createdAt).toLocaleString("es")}</p>
                </div>

                {STATUS_ACTIONS[selected.status]?.length > 0 && (
                  <div className="border-t border-gray-100 pt-3 space-y-2">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Acciones</p>
                    {STATUS_ACTIONS[selected.status].map(({ next, label }) => (
                      <button key={next} onClick={() => changeStatus(selected.id, next)}
                        disabled={updating === selected.id}
                        className={`w-full py-2 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50 ${
                          next === "confirmed" ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700" :
                          next === "completed" ? "bg-green-600 text-white border-green-600 hover:bg-green-700" :
                          next === "cancelled" ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100" :
                          "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                        }`}>
                        {label}
                      </button>
                    ))}
                  </div>
                )}

                <div className="border-t border-gray-100 pt-3">
                  <button onClick={() => deleteAppointment(selected.id)}
                    className="w-full py-2 rounded-lg text-sm text-red-600 border border-red-100 hover:bg-red-50 transition-colors">
                    Eliminar cita
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
