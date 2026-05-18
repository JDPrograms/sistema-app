"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  comparePrice: number | null;
  stock: number | null;
  lowStockAlert: number | null;
  sku: string | null;
  category: string | null;
  imageUrl: string | null;
  featured: boolean;
  isActive: boolean;
}

const EMPTY_FORM: Omit<Product, "id"> = {
  name: "", description: "", price: null, comparePrice: null,
  stock: null, lowStockAlert: null, sku: "", category: "",
  imageUrl: "", featured: false, isActive: true,
};

function StockBadge({ stock, alert }: { stock: number | null; alert: number | null }) {
  if (stock === null) return <span className="text-xs text-gray-400">Sin registro</span>;
  if (stock === 0) return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">Sin stock</span>;
  if (alert != null && stock <= alert) return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">Stock bajo: {stock}</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">{stock} en stock</span>;
}

export default function ProductsAdminPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("Todas");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive" | "featured" | "lowstock" | "nostock">("all");
  const [view, setView] = useState<"grid" | "table">("grid");
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<Omit<Product, "id">>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  async function fetchProducts() {
    const res = await fetch(`/api/site/${slug}/products`);
    const data = await res.json();
    setProducts(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { fetchProducts(); }, [slug]);

  // Derived
  const categories = ["Todas", ...Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[]];
  const outOfStock = products.filter((p) => p.isActive && p.stock === 0).length;
  const lowStock = products.filter((p) => p.isActive && p.stock != null && p.stock > 0 && p.lowStockAlert != null && p.stock <= p.lowStockAlert).length;
  const active = products.filter((p) => p.isActive).length;

  const filtered = products.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !(p.sku?.toLowerCase().includes(search.toLowerCase()))) return false;
    if (filterCat !== "Todas" && p.category !== filterCat) return false;
    if (filterStatus === "active" && !p.isActive) return false;
    if (filterStatus === "inactive" && p.isActive) return false;
    if (filterStatus === "featured" && !p.featured) return false;
    if (filterStatus === "lowstock" && !(p.stock != null && p.stock > 0 && p.lowStockAlert != null && p.stock <= p.lowStockAlert)) return false;
    if (filterStatus === "nostock" && p.stock !== 0) return false;
    return true;
  });

  function openAdd() {
    setEditProduct(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(p: Product) {
    setEditProduct(p);
    setForm({ name: p.name, description: p.description ?? "", price: p.price, comparePrice: p.comparePrice,
      stock: p.stock, lowStockAlert: p.lowStockAlert, sku: p.sku ?? "", category: p.category ?? "",
      imageUrl: p.imageUrl ?? "", featured: p.featured, isActive: p.isActive });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    const body = {
      ...form,
      price: form.price !== null && form.price !== undefined && String(form.price) !== "" ? Number(form.price) : null,
      comparePrice: form.comparePrice !== null && form.comparePrice !== undefined && String(form.comparePrice) !== "" ? Number(form.comparePrice) : null,
      stock: form.stock !== null && form.stock !== undefined && String(form.stock) !== "" ? Number(form.stock) : null,
      lowStockAlert: form.lowStockAlert !== null && form.lowStockAlert !== undefined && String(form.lowStockAlert) !== "" ? Number(form.lowStockAlert) : null,
    };
    if (editProduct) {
      await fetch(`/api/site/${slug}/products/${editProduct.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
    } else {
      await fetch(`/api/site/${slug}/products`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
    }
    setSaving(false);
    setModalOpen(false);
    fetchProducts();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/site/${slug}/products/${id}`, { method: "DELETE" });
    setDeleteConfirm(null);
    fetchProducts();
  }

  async function toggleActive(p: Product) {
    await fetch(`/api/site/${slug}/products/${p.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...p, isActive: !p.isActive }),
    });
    fetchProducts();
  }

  async function toggleFeatured(p: Product) {
    await fetch(`/api/site/${slug}/products/${p.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...p, featured: !p.featured }),
    });
    fetchProducts();
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="text-gray-500 text-sm mt-0.5">Gestiona tu catálogo, precios e inventario</p>
        </div>
        <button onClick={openAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm">
          + Nuevo Producto
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total", value: products.length, color: "bg-gray-50 border-gray-200", text: "text-gray-900", onClick: () => setFilterStatus("all") },
          { label: "Activos", value: active, color: "bg-green-50 border-green-200", text: "text-green-700", onClick: () => setFilterStatus("active") },
          { label: "Sin stock", value: outOfStock, color: "bg-red-50 border-red-200", text: "text-red-700", onClick: () => setFilterStatus("nostock") },
          { label: "Stock bajo", value: lowStock, color: "bg-yellow-50 border-yellow-200", text: "text-yellow-700", onClick: () => setFilterStatus("lowstock") },
        ].map((stat) => (
          <button key={stat.label} onClick={stat.onClick}
            className={`${stat.color} border rounded-xl p-4 text-left hover:shadow-sm transition-shadow`}>
            <p className={`text-2xl font-black ${stat.text}`}>{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input type="text" placeholder="Buscar por nombre o código..."
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
          value={search} onChange={(e) => setSearch(e.target.value)} />

        <select className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white"
          value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>

        <select className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white"
          value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}>
          <option value="all">Todos</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
          <option value="featured">Destacados</option>
          <option value="lowstock">Stock bajo</option>
          <option value="nostock">Sin stock</option>
        </select>

        <div className="flex border border-gray-200 rounded-xl overflow-hidden">
          <button onClick={() => setView("grid")}
            className={`px-3 py-2 text-sm transition-colors ${view === "grid" ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}>
            ⊞
          </button>
          <button onClick={() => setView("table")}
            className={`px-3 py-2 text-sm transition-colors ${view === "table" ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}>
            ☰
          </button>
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">📦</div>
          <p className="font-semibold text-gray-500 mb-1">{products.length === 0 ? "Sin productos aún" : "Sin resultados"}</p>
          <p className="text-sm">{products.length === 0 ? "Agrega tu primer producto con el botón de arriba." : "Prueba cambiando los filtros."}</p>
        </div>
      )}

      {/* ===== GRID VIEW ===== */}
      {view === "grid" && filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((p) => (
            <div key={p.id} className={`bg-white rounded-2xl border overflow-hidden hover:shadow-md transition-all ${!p.isActive ? "opacity-60" : ""} ${p.featured ? "border-amber-300 ring-1 ring-amber-200" : "border-gray-100"}`}>
              {/* Image */}
              <div className="relative h-40 bg-gray-50 overflow-hidden">
                {p.imageUrl
                  ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-3xl text-gray-300">📦</div>}
                {/* Badges */}
                <div className="absolute top-2 left-2 flex gap-1 flex-col items-start">
                  {!p.isActive && <span className="px-1.5 py-0.5 bg-gray-800/70 text-white text-xs rounded font-semibold">Oculto</span>}
                  {p.featured && <span className="px-1.5 py-0.5 bg-amber-500 text-white text-xs rounded font-semibold">⭐</span>}
                  {p.stock === 0 && <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded font-semibold">Sin stock</span>}
                  {p.stock != null && p.stock > 0 && p.lowStockAlert != null && p.stock <= p.lowStockAlert && (
                    <span className="px-1.5 py-0.5 bg-yellow-500 text-white text-xs rounded font-semibold">⚠️ Bajo</span>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="font-bold text-gray-900 text-sm line-clamp-2 leading-tight mb-1">{p.name}</p>
                {p.category && <p className="text-xs text-gray-400 mb-1">{p.category}</p>}
                {p.sku && <p className="text-xs text-gray-400 font-mono">#{p.sku}</p>}

                <div className="mt-2 flex items-center gap-1 flex-wrap">
                  {p.price != null && <span className="font-black text-base text-blue-600">${p.price.toFixed(2)}</span>}
                  {p.comparePrice != null && p.price != null && p.comparePrice > p.price && (
                    <span className="text-xs text-gray-400 line-through">${p.comparePrice.toFixed(2)}</span>
                  )}
                </div>

                <div className="mt-1.5">
                  <StockBadge stock={p.stock} alert={p.lowStockAlert} />
                </div>

                {/* Actions */}
                <div className="mt-3 flex gap-1.5">
                  <button onClick={() => openEdit(p)}
                    className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors">
                    Editar
                  </button>
                  <button onClick={() => toggleActive(p)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-colors ${p.isActive ? "bg-gray-100 hover:bg-yellow-100 text-yellow-700" : "bg-green-100 hover:bg-green-200 text-green-700"}`}
                    title={p.isActive ? "Ocultar del sitio" : "Mostrar en el sitio"}>
                    {p.isActive ? "👁" : "🙈"}
                  </button>
                  <button onClick={() => setDeleteConfirm(p.id)}
                    className="py-1.5 px-2 rounded-lg text-xs bg-red-50 hover:bg-red-100 text-red-500 transition-colors">
                    🗑
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== TABLE VIEW ===== */}
      {view === "table" && filtered.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Producto</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Categoría</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Precio</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Inventario</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Estado</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? "" : "bg-gray-50/50"}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.imageUrl
                          ? <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                          : <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-xl flex-shrink-0">📦</div>}
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{p.name}</p>
                          {p.sku && <p className="text-xs text-gray-400 font-mono">#{p.sku}</p>}
                          {p.featured && <span className="text-xs text-amber-600">⭐ Destacado</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-sm">{p.category || "—"}</td>
                    <td className="px-4 py-3">
                      {p.price != null ? (
                        <div>
                          <span className="font-bold text-gray-900">${p.price.toFixed(2)}</span>
                          {p.comparePrice != null && <span className="ml-1.5 text-xs text-gray-400 line-through">${p.comparePrice.toFixed(2)}</span>}
                        </div>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <StockBadge stock={p.stock} alert={p.lowStockAlert} />
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleActive(p)}
                        className={`px-2 py-1 rounded-full text-xs font-bold transition-colors ${p.isActive ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                        {p.isActive ? "Visible" : "Oculto"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => toggleFeatured(p)} className={`text-sm ${p.featured ? "text-amber-500" : "text-gray-300 hover:text-amber-400"}`} title="Destacar">⭐</button>
                        <button onClick={() => openEdit(p)} className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-colors">Editar</button>
                        <button onClick={() => setDeleteConfirm(p.id)} className="text-xs px-2 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors">🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== DELETE CONFIRM ===== */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <p className="font-bold text-gray-900 text-lg mb-2">¿Eliminar producto?</p>
            <p className="text-gray-500 text-sm mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors">Cancelar</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== ADD / EDIT MODAL ===== */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl">
            {/* Modal header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-3xl sm:rounded-t-2xl z-10">
              <h2 className="text-lg font-bold text-gray-900">{editProduct ? "Editar Producto" : "Nuevo Producto"}</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-700 text-xl">✕</button>
            </div>

            <div className="p-6 space-y-5">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre del producto <span className="text-red-500">*</span></label>
                <input type="text" placeholder="Ej: Shampoo anticaída 400ml"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Descripción</label>
                <textarea rows={3} placeholder="Describe el producto, ingredientes, uso..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 resize-none"
                  value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>

              {/* Precio y precio comparado */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Precio de venta</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input type="number" min={0} step={0.01} placeholder="0.00"
                      className="w-full border border-gray-200 rounded-xl pl-7 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                      value={form.price ?? ""} onChange={(e) => setForm({ ...form, price: e.target.value ? Number(e.target.value) : null })} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Precio anterior <span className="text-xs text-gray-400">(tachado)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input type="number" min={0} step={0.01} placeholder="0.00"
                      className="w-full border border-gray-200 rounded-xl pl-7 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                      value={form.comparePrice ?? ""} onChange={(e) => setForm({ ...form, comparePrice: e.target.value ? Number(e.target.value) : null })} />
                  </div>
                </div>
              </div>

              {/* Imagen */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">URL de imagen</label>
                <input type="url" placeholder="https://..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                  value={form.imageUrl ?? ""} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
                {form.imageUrl && (
                  <div className="mt-2 rounded-xl overflow-hidden h-32 bg-gray-100 border border-gray-200">
                    <img src={form.imageUrl} alt="preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
                  </div>
                )}
              </div>

              {/* Inventario */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <p className="text-sm font-bold text-blue-700 mb-3">📦 Inventario</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Cantidad en stock</label>
                    <input type="number" min={0} step={1} placeholder="Ej: 50"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
                      value={form.stock ?? ""} onChange={(e) => setForm({ ...form, stock: e.target.value ? Number(e.target.value) : null })} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Alerta de stock bajo</label>
                    <input type="number" min={0} step={1} placeholder="Ej: 5"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
                      value={form.lowStockAlert ?? ""} onChange={(e) => setForm({ ...form, lowStockAlert: e.target.value ? Number(e.target.value) : null })} />
                  </div>
                </div>
                {form.stock != null && form.lowStockAlert != null && (
                  <p className="text-xs text-blue-600 mt-2">
                    {form.stock === 0 ? "⛔ Sin stock" : form.stock <= form.lowStockAlert ? `⚠️ Stock bajo (${form.stock} unidades)` : `✅ Stock OK (${form.stock} unidades)`}
                  </p>
                )}
              </div>

              {/* Categoría y SKU */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Categoría</label>
                  <input type="text" placeholder="Ej: Bebidas, Limpieza..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                    value={form.category ?? ""} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Código / SKU <span className="text-xs text-gray-400">(opcional)</span>
                  </label>
                  <input type="text" placeholder="Ej: PROD-001"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                    value={form.sku ?? ""} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex gap-4">
                <label className="flex items-center gap-3 cursor-pointer flex-1 bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="relative flex-shrink-0">
                    <input type="checkbox" className="sr-only" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                    <div className={`w-10 h-6 rounded-full transition-colors ${form.isActive ? "bg-green-500" : "bg-gray-200"}`} />
                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive ? "translate-x-4" : ""}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Visible en sitio</p>
                    <p className="text-xs text-gray-400">Mostrar a los clientes</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer flex-1 bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="relative flex-shrink-0">
                    <input type="checkbox" className="sr-only" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
                    <div className={`w-10 h-6 rounded-full transition-colors ${form.featured ? "bg-amber-500" : "bg-gray-200"}`} />
                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.featured ? "translate-x-4" : ""}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Destacado ⭐</p>
                    <p className="text-xs text-gray-400">Resaltar en el catálogo</p>
                  </div>
                </label>
              </div>

              {/* Submit */}
              <button onClick={handleSave} disabled={saving || !form.name.trim()}
                className="w-full py-3.5 rounded-xl text-white font-bold text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-sm">
                {saving ? "Guardando..." : editProduct ? "Guardar cambios" : "Agregar producto"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
