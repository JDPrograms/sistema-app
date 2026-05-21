"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface Task { id: string; title: string; description?: string; status: string; priority: string; assignedTo?: string; dueDate?: string; createdAt: string }

const statusLabel: Record<string, string> = { pending: "Pendiente", in_progress: "En proceso", done: "Hecho", cancelled: "Cancelado" };
const priorityLabel: Record<string, string> = { low: "Baja", normal: "Normal", high: "Alta", urgent: "Urgente" };
const priorityColor: Record<string, string> = { low: "bg-gray-100 text-gray-600", normal: "bg-blue-100 text-blue-700", high: "bg-amber-100 text-amber-700", urgent: "bg-red-100 text-red-700" };
const statusColor: Record<string, string> = { pending: "bg-gray-100 text-gray-600", in_progress: "bg-blue-100 text-blue-700", done: "bg-green-100 text-green-700", cancelled: "bg-red-100 text-red-600" };

export default function TasksPage() {
  const { slug } = useParams() as { slug: string };
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", description: "", priority: "normal", assignedTo: "", dueDate: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [filter, setFilter] = useState("all");

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/site/${slug}/tasks`);
    if (res.ok) { const d = await res.json(); setTasks(d.tasks); }
    setLoading(false);
  }

  useEffect(() => { load(); }, [slug]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/site/${slug}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) { setMsg("Tarea creada"); setForm({ title: "", description: "", priority: "normal", assignedTo: "", dueDate: "" }); load(); }
    else setMsg("Error");
    setTimeout(() => setMsg(""), 3000);
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/site/${slug}/tasks/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar tarea?")) return;
    await fetch(`/api/site/${slug}/tasks/${id}`, { method: "DELETE" });
    load();
  }

  const filtered = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tareas internas</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Nueva tarea</h2>
        <form onSubmit={handleCreate} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="low">Baja</option>
                <option value="normal">Normal</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Asignado a</label>
              <input value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nombre del responsable" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha límite</label>
              <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            {msg && <span className="text-sm text-green-600">{msg}</span>}
            <button type="submit" disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">
              {saving ? "Creando..." : "Crear tarea"}
            </button>
          </div>
        </form>
      </div>

      <div className="flex gap-2 mb-4">
        {["all", "pending", "in_progress", "done"].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${filter === f ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            {f === "all" ? "Todas" : statusLabel[f]}
          </button>
        ))}
      </div>

      {loading ? <p className="text-sm text-gray-400">Cargando...</p> : (
        <div className="space-y-2">
          {filtered.length === 0 && <p className="text-sm text-gray-400">No hay tareas.</p>}
          {filtered.map((task) => (
            <div key={task.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColor[task.priority]}`}>{priorityLabel[task.priority]}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[task.status]}`}>{statusLabel[task.status]}</span>
                </div>
                <p className="font-medium text-gray-900">{task.title}</p>
                {task.description && <p className="text-xs text-gray-500 mt-0.5">{task.description}</p>}
                <div className="text-xs text-gray-400 mt-1 flex gap-3">
                  {task.assignedTo && <span>→ {task.assignedTo}</span>}
                  {task.dueDate && <span>Vence: {new Date(task.dueDate).toLocaleDateString("es")}</span>}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {task.status !== "done" && (
                  <button onClick={() => updateStatus(task.id, task.status === "pending" ? "in_progress" : "done")}
                    className="text-xs px-3 py-1 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 transition-colors">
                    {task.status === "pending" ? "Iniciar" : "Completar"}
                  </button>
                )}
                <button onClick={() => handleDelete(task.id)} className="text-xs text-red-500 hover:underline">Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
