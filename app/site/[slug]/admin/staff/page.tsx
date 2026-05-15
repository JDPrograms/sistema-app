"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface StaffMember {
  id: string; name: string; email?: string; phone?: string;
  specialty?: string; isActive: boolean; createdAt: string;
}

const emptyForm = { name: "", email: "", phone: "", specialty: "" };

export default function StaffPage() {
  const { slug } = useParams() as { slug: string };
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);

  async function load() {
    setLoading(true);
    const r = await fetch(`/api/site/${slug}/staff`);
    if (r.ok) setStaff(await r.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, [slug]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    await fetch(`/api/site/${slug}/staff`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setForm(emptyForm);
    load();
  }

  async function handleUpdate(id: string) {
    const r = await fetch(`/api/site/${slug}/staff/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    if (r.ok) {
      const updated = await r.json();
      setStaff((p) => p.map((s) => (s.id === id ? updated : s)));
      setEditingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Eliminar este miembro del personal?")) return;
    await fetch(`/api/site/${slug}/staff/${id}`, { method: "DELETE" });
    setStaff((p) => p.filter((s) => s.id !== id));
  }

  async function handleToggle(member: StaffMember) {
    const r = await fetch(`/api/site/${slug}/staff/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !member.isActive }),
    });
    if (r.ok) {
      const updated = await r.json();
      setStaff((p) => p.map((s) => (s.id === member.id ? updated : s)));
    }
  }

  function startEdit(member: StaffMember) {
    setEditingId(member.id);
    setEditForm({ name: member.name, email: member.email || "", phone: member.phone || "", specialty: member.specialty || "" });
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Personal</h1>
        <p className="text-gray-500 mt-1">Gestiona el equipo que atendera las citas</p>
      </div>

      {/* Formulario para agregar */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Agregar miembro del personal</h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Juan Garcia"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Especialidad / Rol</label>
            <input
              value={form.specialty}
              onChange={(e) => setForm((p) => ({ ...p, specialty: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Barbero, Estilista, Mecanico..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="juan@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
            <input
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+1 234 567 8900"
            />
          </div>
          <div className="col-span-1 md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              {saving ? "Guardando..." : "Agregar personal"}
            </button>
          </div>
        </form>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">Cargando...</div>
      ) : staff.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-3xl mb-3">👥</p>
          <p className="text-gray-500 font-medium">No hay personal registrado aun</p>
          <p className="text-gray-400 text-sm mt-1">Agrega miembros del personal para asignarlos a citas</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {staff.map((member) => (
            <div key={member.id} className="p-4">
              {editingId === member.id ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    value={editForm.name}
                    onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nombre"
                  />
                  <input
                    value={editForm.specialty}
                    onChange={(e) => setEditForm((p) => ({ ...p, specialty: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Especialidad"
                  />
                  <input
                    value={editForm.email}
                    onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Email"
                  />
                  <input
                    value={editForm.phone}
                    onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Telefono"
                  />
                  <div className="col-span-1 md:col-span-2 flex gap-2 justify-end">
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-4 py-2 rounded-lg text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleUpdate(member.id)}
                      className="px-4 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600 text-sm flex-shrink-0">
                    {member.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{member.name}</p>
                      {!member.isActive && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">Inactivo</span>
                      )}
                    </div>
                    <div className="flex gap-3 text-xs text-gray-400 mt-0.5 flex-wrap">
                      {member.specialty && <span className="font-medium text-gray-500">{member.specialty}</span>}
                      {member.email && <span>{member.email}</span>}
                      {member.phone && <span>{member.phone}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => startEdit(member)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleToggle(member)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        member.isActive
                          ? "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100"
                          : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                      }`}
                    >
                      {member.isActive ? "Desactivar" : "Activar"}
                    </button>
                    <button
                      onClick={() => handleDelete(member.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border bg-red-50 text-red-600 border-red-200 hover:bg-red-100 transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
