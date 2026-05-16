"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ImageUpload from "@/components/ui/ImageUpload";

interface ServiceItem {
  id: string; name: string; description?: string; price?: number;
  duration?: number; imageUrl?: string; isActive: boolean;
}
interface ProductItem {
  id: string; name: string; description?: string; price?: number;
  stock?: number; category?: string; imageUrl?: string; isActive: boolean;
}

const emptyServiceForm = { name: "", description: "", price: "", duration: "", imageUrl: "" };
const emptyProductForm = { name: "", description: "", price: "", stock: "", category: "", imageUrl: "" };

const inp = "w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

export default function ContentPage() {
  const { slug } = useParams() as { slug: string };
  const [tab, setTab] = useState<"services" | "products">("services");
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddForm, setShowAddForm] = useState(false);
  const [serviceForm, setServiceForm] = useState(emptyServiceForm);
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editServiceForm, setEditServiceForm] = useState(emptyServiceForm);
  const [editProductForm, setEditProductForm] = useState(emptyProductForm);

  async function loadAll() {
    const [sRes, pRes] = await Promise.all([
      fetch(`/api/site/${slug}/services`),
      fetch(`/api/site/${slug}/products`),
    ]);
    if (sRes.ok) setServices(await sRes.json());
    if (pRes.ok) setProducts(await pRes.json());
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, [slug]);

  // ---- ADD ----
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    if (tab === "services") {
      const body: any = { name: serviceForm.name };
      if (serviceForm.description) body.description = serviceForm.description;
      if (serviceForm.price) body.price = parseFloat(serviceForm.price);
      if (serviceForm.duration) body.duration = parseInt(serviceForm.duration);
      if (serviceForm.imageUrl) body.imageUrl = serviceForm.imageUrl;
      const r = await fetch(`/api/site/${slug}/services`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const data = await r.json();
      if (r.ok) { setServices((p) => [...p, data]); setServiceForm(emptyServiceForm); setShowAddForm(false); }
      else setError(data.error || "Error al guardar");
    } else {
      const body: any = { name: productForm.name };
      if (productForm.description) body.description = productForm.description;
      if (productForm.price) body.price = parseFloat(productForm.price);
      if (productForm.stock) body.stock = parseInt(productForm.stock);
      if (productForm.category) body.category = productForm.category;
      if (productForm.imageUrl) body.imageUrl = productForm.imageUrl;
      const r = await fetch(`/api/site/${slug}/products`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const data = await r.json();
      if (r.ok) { setProducts((p) => [...p, data]); setProductForm(emptyProductForm); setShowAddForm(false); }
      else setError(data.error || "Error al guardar");
    }
    setSaving(false);
  }

  // ---- EDIT ----
  function startEdit(item: ServiceItem | ProductItem) {
    setEditingId(item.id);
    if (tab === "services") {
      const s = item as ServiceItem;
      setEditServiceForm({
        name: s.name, description: s.description || "", price: s.price != null ? String(s.price) : "",
        duration: s.duration != null ? String(s.duration) : "", imageUrl: s.imageUrl || "",
      });
    } else {
      const p = item as ProductItem;
      setEditProductForm({
        name: p.name, description: p.description || "", price: p.price != null ? String(p.price) : "",
        stock: p.stock != null ? String(p.stock) : "", category: p.category || "", imageUrl: p.imageUrl || "",
      });
    }
  }

  async function handleSaveEdit(id: string) {
    const endpoint = tab === "services" ? "services" : "products";
    const idParam = tab === "services" ? "serviceId" : "productId";
    const form = tab === "services" ? editServiceForm : editProductForm;
    const body: any = { name: form.name };
    if (form.description !== undefined) body.description = form.description || null;
    if (form.price) body.price = parseFloat(form.price); else body.price = null;
    if (tab === "services") {
      const sf = editServiceForm;
      if (sf.duration) body.duration = parseInt(sf.duration); else body.duration = null;
    } else {
      const pf = editProductForm;
      if (pf.stock) body.stock = parseInt(pf.stock); else body.stock = null;
      body.category = pf.category || null;
    }
    body.imageUrl = form.imageUrl || null;
    body.isActive = tab === "services"
      ? (services.find(s => s.id === id)?.isActive ?? true)
      : (products.find(p => p.id === id)?.isActive ?? true);

    const r = await fetch(`/api/site/${slug}/${endpoint}/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    if (r.ok) {
      const updated = await r.json();
      if (tab === "services") setServices((p) => p.map((s) => s.id === id ? updated : s));
      else setProducts((p) => p.map((pr) => pr.id === id ? updated : pr));
      setEditingId(null);
    }
  }

  // ---- TOGGLE ----
  async function handleToggle(item: ServiceItem | ProductItem) {
    const endpoint = tab === "services" ? "services" : "products";
    const r = await fetch(`/api/site/${slug}/${endpoint}/${item.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...item, isActive: !item.isActive }),
    });
    if (r.ok) {
      const updated = await r.json();
      if (tab === "services") setServices((p) => p.map((s) => s.id === item.id ? updated : s));
      else setProducts((p) => p.map((pr) => pr.id === item.id ? updated : pr));
    }
  }

  // ---- DELETE ----
  async function handleDelete(id: string) {
    if (!confirm("Eliminar este elemento?")) return;
    const endpoint = tab === "services" ? "services" : "products";
    await fetch(`/api/site/${slug}/${endpoint}/${id}`, { method: "DELETE" });
    if (tab === "services") setServices((p) => p.filter((s) => s.id !== id));
    else setProducts((p) => p.filter((pr) => pr.id !== id));
  }

  const items = (tab === "services" ? services : products) as (ServiceItem | ProductItem)[];

  return (
    <div className="p-4 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contenido del sitio</h1>
          <p className="text-gray-500 mt-1">Gestiona servicios y productos</p>
        </div>
        <button onClick={() => { setShowAddForm(!showAddForm); setEditingId(null); setError(""); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors">
          + Agregar
        </button>
      </div>

      {/* Tabs */}
      <div className="flex rounded-lg border border-gray-200 p-1 w-64 mb-6">
        {(["services", "products"] as const).map((t) => (
          <button key={t} onClick={() => { setTab(t); setShowAddForm(false); setEditingId(null); }}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${tab === t ? "bg-blue-600 text-white" : "text-gray-500 hover:text-gray-700"}`}>
            {t === "services" ? `Servicios (${services.length})` : `Productos (${products.length})`}
          </button>
        ))}
      </div>

      {/* Formulario agregar */}
      {showAddForm && (
        <form onSubmit={handleAdd} className="bg-white rounded-xl border border-gray-200 p-6 mb-6 space-y-4">
          <h2 className="font-semibold text-gray-900">
            Nuevo {tab === "services" ? "servicio" : "producto"}
          </h2>
          {tab === "services" ? (
            <ServiceFields form={serviceForm} setForm={setServiceForm} slug={slug} />
          ) : (
            <ProductFields form={productForm} setForm={setProductForm} slug={slug} />
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
              {saving ? "Guardando..." : "Agregar"}
            </button>
            <button type="button" onClick={() => { setShowAddForm(false); setError(""); }}
              className="px-6 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Lista */}
      <div className="bg-white rounded-xl border border-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Cargando...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            No hay {tab === "services" ? "servicios" : "productos"} agregados aun.
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {items.map((item) => (
              <div key={item.id} className={`p-5 transition-opacity ${!item.isActive ? "opacity-60" : ""}`}>
                {editingId === item.id ? (
                  // ---- INLINE EDIT ----
                  <div className="space-y-4">
                    <p className="text-sm font-semibold text-gray-700">Editando: {item.name}</p>
                    {tab === "services" ? (
                      <ServiceFields form={editServiceForm} setForm={setEditServiceForm} slug={slug} />
                    ) : (
                      <ProductFields form={editProductForm} setForm={setEditProductForm} slug={slug} />
                    )}
                    <div className="flex gap-2">
                      <button type="button" onClick={() => handleSaveEdit(item.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">
                        Guardar cambios
                      </button>
                      <button type="button" onClick={() => setEditingId(null)}
                        className="px-5 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  // ---- VIEW ----
                  <div className="flex items-start gap-4">
                    {/* Imagen */}
                    {(item as ServiceItem).imageUrl ? (
                      <img src={(item as ServiceItem).imageUrl!} alt={item.name}
                        className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-gray-100"
                        onError={(e) => (e.currentTarget.style.display = "none")} />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-xl flex-shrink-0">
                        {tab === "services" ? "🔧" : "📦"}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-semibold text-gray-900">{item.name}</p>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${item.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {item.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-sm text-gray-500 mb-1 line-clamp-2">{item.description}</p>
                      )}
                      <div className="flex gap-3 text-xs text-gray-400 flex-wrap">
                        {item.price != null && <span className="font-medium text-gray-600">${item.price.toFixed(2)}</span>}
                        {tab === "services" && (item as ServiceItem).duration != null && (
                          <span>{(item as ServiceItem).duration} min</span>
                        )}
                        {tab === "products" && (item as ProductItem).stock != null && (
                          <span>Stock: {(item as ProductItem).stock}</span>
                        )}
                        {tab === "products" && (item as ProductItem).category && (
                          <span className="px-1.5 py-0.5 bg-gray-100 rounded">{(item as ProductItem).category}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
                      <button onClick={() => startEdit(item)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium border bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 transition-colors">
                        Editar
                      </button>
                      <button onClick={() => handleToggle(item)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          item.isActive
                            ? "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100"
                            : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                        }`}>
                        {item.isActive ? "Desactivar" : "Activar"}
                      </button>
                      <button onClick={() => handleDelete(item.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium border bg-red-50 text-red-600 border-red-200 hover:bg-red-100 transition-colors">
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
    </div>
  );
}

function ServiceFields({ form, setForm, slug }: {
  form: typeof emptyServiceForm;
  setForm: React.Dispatch<React.SetStateAction<typeof emptyServiceForm>>;
  slug?: string;
}) {
  const inp = "w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
        <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required className={inp} />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
        <input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className={inp} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Precio ($)</label>
        <input type="number" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
          step="0.01" min="0" className={inp} placeholder="0.00" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Duracion (min)</label>
        <input type="number" value={form.duration} onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))}
          min="0" className={inp} placeholder="30" />
      </div>
      <div className="sm:col-span-2">
        <ImageUpload
          label="Imagen del servicio"
          value={form.imageUrl}
          onChange={(url) => setForm((p) => ({ ...p, imageUrl: url }))}
          slug={slug}
        />
      </div>
    </div>
  );
}

function ProductFields({ form, setForm, slug }: {
  form: typeof emptyProductForm;
  setForm: React.Dispatch<React.SetStateAction<typeof emptyProductForm>>;
  slug?: string;
}) {
  const inp = "w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
        <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required className={inp} />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
        <input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className={inp} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Precio ($)</label>
        <input type="number" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
          step="0.01" min="0" className={inp} placeholder="0.00" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
        <input type="number" value={form.stock} onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))}
          min="0" className={inp} placeholder="0" />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
        <input value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
          className={inp} placeholder="Ej: Herramientas, Bebidas, Cortes..." />
      </div>
      <div className="sm:col-span-2">
        <ImageUpload
          label="Imagen del producto"
          value={form.imageUrl}
          onChange={(url) => setForm((p) => ({ ...p, imageUrl: url }))}
          slug={slug}
        />
      </div>
    </div>
  );
}
