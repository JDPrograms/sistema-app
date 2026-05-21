"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Appointment { id: string; clientName: string; serviceName?: string; staffName?: string; date: string; time: string; status: string }

const statusColor: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-600",
  completed: "bg-blue-100 text-blue-700",
};

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export default function CalendarPage() {
  const { slug } = useParams() as { slug: string };
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/site/${slug}/appointments?limit=200`)
      .then((r) => r.json())
      .then((d) => { setAppointments(d.data || d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  function prevMonth() { if (month === 0) { setMonth(11); setYear((y) => y - 1); } else setMonth((m) => m - 1); }
  function nextMonth() { if (month === 11) { setMonth(0); setYear((y) => y + 1); } else setMonth((m) => m + 1); }

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const byDate: Record<string, Appointment[]> = {};
  appointments.forEach((a) => {
    if (!byDate[a.date]) byDate[a.date] = [];
    byDate[a.date].push(a);
  });

  function formatDate(d: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  const selectedApps = selected ? byDate[selected] || [] : [];

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Calendario de citas</h1>
        <Link href={`/site/${slug}/admin/appointments`} className="text-sm text-blue-600 hover:underline">Ver lista</Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 flex items-center justify-center">←</button>
          <h2 className="font-semibold text-gray-900">{MONTHS[month]} {year}</h2>
          <button onClick={nextMonth} className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 flex items-center justify-center">→</button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAYS.map((d) => <div key={d} className="text-xs font-medium text-gray-400 text-center py-1">{d}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
            const dateStr = formatDate(d);
            const apps = byDate[dateStr] || [];
            const isToday = dateStr === today.toISOString().split("T")[0];
            const isSelected = selected === dateStr;
            return (
              <button key={d} onClick={() => setSelected(isSelected ? null : dateStr)}
                className={`min-h-[56px] rounded-lg p-1 text-left transition-colors ${isSelected ? "bg-blue-100 border-2 border-blue-500" : isToday ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50 border border-transparent"}`}>
                <p className={`text-sm font-medium ${isToday ? "text-blue-600" : "text-gray-700"}`}>{d}</p>
                {apps.slice(0, 2).map((a) => (
                  <div key={a.id} className={`text-xs truncate rounded px-1 mt-0.5 ${statusColor[a.status]}`}>
                    {a.time} {a.clientName}
                  </div>
                ))}
                {apps.length > 2 && <p className="text-xs text-gray-400 mt-0.5">+{apps.length - 2}</p>}
              </button>
            );
          })}
        </div>
      </div>

      {selected && selectedApps.length > 0 && (
        <div className="mt-4 bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Citas del {selected}</h3>
          <div className="space-y-2">
            {selectedApps.sort((a, b) => a.time.localeCompare(b.time)).map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl text-sm">
                <span className="text-gray-400 font-mono">{a.time}</span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{a.clientName}</p>
                  {a.serviceName && <p className="text-xs text-gray-500">{a.serviceName}{a.staffName ? ` · ${a.staffName}` : ""}</p>}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[a.status]}`}>
                  {a.status === "pending" ? "Pendiente" : a.status === "confirmed" ? "Confirmada" : a.status === "cancelled" ? "Cancelada" : "Completada"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
