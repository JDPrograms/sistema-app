"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";

// ===== TYPES =====
interface InvoiceItem { description: string; qty: number; unitPrice: number; total: number; }
interface Invoice {
  id: string; type: "invoice" | "quote"; number: string;
  clientName: string; clientEmail: string | null; clientPhone: string | null; clientAddress: string | null;
  status: string; items: string; subtotal: number; taxRate: number; discount: number; total: number;
  notes: string | null; dueDate: string | null; paidAt: string | null; createdAt: string;
}
interface Expense {
  id: string; description: string; amount: number; category: string | null;
  date: string; receipt: string | null; notes: string | null;
}
interface InventoryLog {
  id: string; productId: string; productName: string;
  type: "in" | "out" | "adjustment"; quantity: number;
  previousStock: number | null; newStock: number | null; reason: string | null; createdAt: string;
}
interface Product { id: string; name: string; stock: number | null; }
interface BillingConfig {
  invoicePrefix?: string; quotePrefix?: string; taxRate?: number;
  currency?: string; taxId?: string; companyName?: string; paymentTerms?: string; invoiceFooter?: string;
}

// ===== HELPERS =====
const STATUS = {
  draft:    { label: "Borrador",   cls: "bg-gray-100 text-gray-600" },
  sent:     { label: "Enviado",    cls: "bg-blue-100 text-blue-700" },
  paid:     { label: "Pagado",     cls: "bg-green-100 text-green-700" },
  cancelled:{ label: "Cancelado",  cls: "bg-red-100 text-red-600" },
  accepted: { label: "Aceptado",   cls: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "Rechazado",  cls: "bg-red-100 text-red-600" },
};

function Badge({ status }: { status: string }) {
  const s = (STATUS as any)[status] || { label: status, cls: "bg-gray-100 text-gray-600" };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${s.cls}`}>{s.label}</span>;
}

function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" });
}

function parseItems(s: string): InvoiceItem[] {
  try { const p = JSON.parse(s); return Array.isArray(p) ? p : []; } catch { return []; }
}

// ===== EMPTY FORMS =====
const EMPTY_INV: { type: "invoice" | "quote"; clientName: string; clientEmail: string; clientPhone: string; clientAddress: string; status: string; taxRate: number; discount: number; notes: string; dueDate: string; } = {
  type: "invoice", clientName: "", clientEmail: "", clientPhone: "", clientAddress: "",
  status: "draft", taxRate: 0, discount: 0, notes: "", dueDate: "",
};
const EMPTY_EXP = { description: "", amount: "", category: "", date: "", receipt: "", notes: "" };
const EMPTY_LOG = { productId: "", type: "in" as "in" | "out" | "adjustment", quantity: 1, reason: "" };

// ===== MAIN =====
export default function BillingPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [tab, setTab] = useState<"summary" | "invoices" | "quotes" | "expenses" | "inventory" | "config">("summary");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [invLogs, setInvLogs] = useState<InventoryLog[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [billingCfg, setBillingCfg] = useState<BillingConfig>({});
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Invoice modal
  const [invModal, setInvModal] = useState(false);
  const [editInv, setEditInv] = useState<Invoice | null>(null);
  const [invForm, setInvForm] = useState(EMPTY_INV);
  const [invItems, setInvItems] = useState<InvoiceItem[]>([{ description: "", qty: 1, unitPrice: 0, total: 0 }]);
  const [savingInv, setSavingInv] = useState(false);

  // Expense modal
  const [expModal, setExpModal] = useState(false);
  const [editExp, setEditExp] = useState<Expense | null>(null);
  const [expForm, setExpForm] = useState(EMPTY_EXP);
  const [savingExp, setSavingExp] = useState(false);

  // Inventory adjustment
  const [logForm, setLogForm] = useState(EMPTY_LOG);
  const [savingLog, setSavingLog] = useState(false);

  // Misc
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "invoice" | "expense"; id: string } | null>(null);
  const [viewInv, setViewInv] = useState<Invoice | null>(null);
  const [savingCfg, setSavingCfg] = useState(false);
  const [cfgForm, setCfgForm] = useState<BillingConfig>({});

  const fetchAll = useCallback(async () => {
    const [invRes, expRes, logRes, prodRes, cfgRes, sessionRes] = await Promise.all([
      fetch(`/api/site/${slug}/billing/invoices`),
      fetch(`/api/site/${slug}/billing/expenses`),
      fetch(`/api/site/${slug}/billing/inventory`),
      fetch(`/api/site/${slug}/products`),
      fetch(`/api/site/${slug}/billing/config`),
      fetch("/api/auth/session"),
    ]);
    const [inv, exp, logs, prods, cfg, sess] = await Promise.all([
      invRes.json(), expRes.json(), logRes.json(), prodRes.json(), cfgRes.json(), sessionRes.json(),
    ]);
    setInvoices(Array.isArray(inv) ? inv : []);
    setExpenses(Array.isArray(exp) ? exp : []);
    setInvLogs(Array.isArray(logs) ? logs : []);
    setProducts(Array.isArray(prods) ? prods : []);
    if (cfg && typeof cfg === "object") { setBillingCfg(cfg); setCfgForm(cfg); }
    if (sess?.user?.role === "superadmin") setIsSuperAdmin(true);
    setLoading(false);
  }, [slug]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ===== DERIVED =====
  const cur = billingCfg.currency || "$";
  const paidInv = invoices.filter(i => i.type === "invoice" && i.status === "paid");
  const pendingInv = invoices.filter(i => i.type === "invoice" && ["draft", "sent"].includes(i.status));
  const totalIncome = paidInv.reduce((s, i) => s + i.total, 0);
  const pendingAmt = pendingInv.reduce((s, i) => s + i.total, 0);
  const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
  const profit = totalIncome - totalExp;

  // ===== INVOICE HELPERS =====
  function calcTotals() {
    const sub = invItems.reduce((s, i) => s + i.total, 0);
    const tax = sub * (invForm.taxRate || 0) / 100;
    return { sub, tax, total: Math.max(0, sub + tax - (invForm.discount || 0)) };
  }

  function updateItem(idx: number, patch: Partial<InvoiceItem>) {
    setInvItems(prev => {
      const next = [...prev];
      const item = { ...next[idx], ...patch };
      item.total = item.qty * item.unitPrice;
      next[idx] = item;
      return next;
    });
  }

  function openAddInv(type: "invoice" | "quote") {
    setEditInv(null);
    setInvForm({ ...EMPTY_INV, type, taxRate: billingCfg.taxRate ?? 0 });
    setInvItems([{ description: "", qty: 1, unitPrice: 0, total: 0 }]);
    setInvModal(true);
  }

  function openEditInv(inv: Invoice) {
    setEditInv(inv);
    const parsed = parseItems(inv.items);
    setInvItems(parsed.length > 0 ? parsed : [{ description: "", qty: 1, unitPrice: 0, total: 0 }]);
    setInvForm({
      type: inv.type, clientName: inv.clientName, clientEmail: inv.clientEmail ?? "",
      clientPhone: inv.clientPhone ?? "", clientAddress: inv.clientAddress ?? "",
      status: inv.status, taxRate: inv.taxRate, discount: inv.discount,
      notes: inv.notes ?? "", dueDate: inv.dueDate ? inv.dueDate.split("T")[0] : "",
    });
    setInvModal(true);
  }

  async function saveInv() {
    if (!invForm.clientName.trim()) return;
    setSavingInv(true);
    const { sub, tax, total } = calcTotals();
    const body = { ...invForm, items: JSON.stringify(invItems), subtotal: sub, total, dueDate: invForm.dueDate || null };
    const url = editInv ? `/api/site/${slug}/billing/invoices/${editInv.id}` : `/api/site/${slug}/billing/invoices`;
    await fetch(url, { method: editInv ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSavingInv(false);
    setInvModal(false);
    fetchAll();
  }

  async function deleteInv(id: string) {
    await fetch(`/api/site/${slug}/billing/invoices/${id}`, { method: "DELETE" });
    setDeleteConfirm(null);
    fetchAll();
  }

  async function changeStatus(inv: Invoice, status: string) {
    await fetch(`/api/site/${slug}/billing/invoices/${inv.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...inv, status }),
    });
    fetchAll();
  }

  async function convertToInvoice(quote: Invoice) {
    await fetch(`/api/site/${slug}/billing/invoices`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "invoice", clientName: quote.clientName, clientEmail: quote.clientEmail,
        clientPhone: quote.clientPhone, clientAddress: quote.clientAddress, status: "draft",
        items: quote.items, subtotal: quote.subtotal, taxRate: quote.taxRate,
        discount: quote.discount, total: quote.total, notes: quote.notes }),
    });
    await fetch(`/api/site/${slug}/billing/invoices/${quote.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...quote, status: "accepted" }),
    });
    fetchAll();
    setTab("invoices");
  }

  // ===== EXPENSE HELPERS =====
  function openAddExp() {
    setEditExp(null);
    setExpForm({ ...EMPTY_EXP, date: new Date().toISOString().split("T")[0] });
    setExpModal(true);
  }

  function openEditExp(exp: Expense) {
    setEditExp(exp);
    setExpForm({ description: exp.description, amount: String(exp.amount),
      category: exp.category ?? "", date: exp.date.split("T")[0],
      receipt: exp.receipt ?? "", notes: exp.notes ?? "" });
    setExpModal(true);
  }

  async function saveExp() {
    if (!expForm.description.trim() || !expForm.amount) return;
    setSavingExp(true);
    const body = { ...expForm, amount: Number(expForm.amount) };
    const url = editExp ? `/api/site/${slug}/billing/expenses/${editExp.id}` : `/api/site/${slug}/billing/expenses`;
    await fetch(url, { method: editExp ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSavingExp(false);
    setExpModal(false);
    fetchAll();
  }

  async function deleteExp(id: string) {
    await fetch(`/api/site/${slug}/billing/expenses/${id}`, { method: "DELETE" });
    setDeleteConfirm(null);
    fetchAll();
  }

  // ===== INVENTORY =====
  async function saveLog() {
    if (!logForm.productId || logForm.quantity <= 0) return;
    setSavingLog(true);
    await fetch(`/api/site/${slug}/billing/inventory`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(logForm),
    });
    setSavingLog(false);
    setLogForm(EMPTY_LOG);
    fetchAll();
  }

  // ===== CONFIG =====
  async function saveCfg() {
    setSavingCfg(true);
    await fetch(`/api/site/${slug}/billing/config`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cfgForm),
    });
    setBillingCfg(cfgForm);
    setSavingCfg(false);
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const { sub, tax, total: invTotal } = calcTotals();

  return (
    <div className="p-4 sm:p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Contabilidad</h1>
        <p className="text-gray-500 text-sm mt-0.5">Facturas · Cotizaciones · Gastos · Inventario</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 overflow-x-auto">
        {[
          { key: "summary",   label: "📊 Resumen" },
          { key: "invoices",  label: "🧾 Facturas" },
          { key: "quotes",    label: "📋 Cotizaciones" },
          { key: "expenses",  label: "💸 Gastos" },
          { key: "inventory", label: "📦 Inventario" },
          ...(isSuperAdmin ? [{ key: "config", label: "⚙️ Config" }] : []),
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${tab === t.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ===== RESUMEN ===== */}
      {tab === "summary" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Ingresos cobrados", val: `${cur}${totalIncome.toFixed(2)}`, color: "text-green-700", bg: "bg-green-50 border-green-200", icon: "💰" },
              { label: "Por cobrar",        val: `${cur}${pendingAmt.toFixed(2)}`,  color: "text-blue-700",  bg: "bg-blue-50 border-blue-200",  icon: "⏳" },
              { label: "Gastos totales",    val: `${cur}${totalExp.toFixed(2)}`,    color: "text-red-700",   bg: "bg-red-50 border-red-200",    icon: "📤" },
              { label: "Ganancia neta",     val: `${cur}${profit.toFixed(2)}`,      color: profit >= 0 ? "text-emerald-700" : "text-red-700", bg: profit >= 0 ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200", icon: "📈" },
            ].map(s => (
              <div key={s.label} className={`${s.bg} border rounded-2xl p-5`}>
                <p className="text-2xl mb-1">{s.icon}</p>
                <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button onClick={() => { setTab("invoices"); openAddInv("invoice"); }} className="bg-blue-600 text-white rounded-xl py-3 px-4 text-sm font-bold hover:bg-blue-700 transition-colors">+ Nueva Factura</button>
            <button onClick={() => { setTab("quotes"); openAddInv("quote"); }}   className="bg-indigo-600 text-white rounded-xl py-3 px-4 text-sm font-bold hover:bg-indigo-700 transition-colors">+ Nueva Cotización</button>
            <button onClick={() => { setTab("expenses"); openAddExp(); }}        className="bg-orange-500 text-white rounded-xl py-3 px-4 text-sm font-bold hover:bg-orange-600 transition-colors">+ Nuevo Gasto</button>
            <button onClick={() => setTab("inventory")}                          className="bg-gray-700 text-white rounded-xl py-3 px-4 text-sm font-bold hover:bg-gray-800 transition-colors">📦 Ajustar Stock</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Facturas recientes</h3>
                <button onClick={() => setTab("invoices")} className="text-xs text-blue-600 hover:text-blue-800">Ver todas →</button>
              </div>
              {invoices.filter(i => i.type === "invoice").slice(0, 6).length === 0
                ? <p className="text-gray-400 text-sm text-center py-8">Sin facturas aún</p>
                : invoices.filter(i => i.type === "invoice").slice(0, 6).map(inv => (
                    <div key={inv.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{inv.number}</p>
                        <p className="text-xs text-gray-400">{inv.clientName}</p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <p className="text-sm font-bold text-gray-900">{cur}{inv.total.toFixed(2)}</p>
                        <Badge status={inv.status} />
                      </div>
                    </div>
                  ))
              }
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Gastos recientes</h3>
                <button onClick={() => setTab("expenses")} className="text-xs text-blue-600 hover:text-blue-800">Ver todos →</button>
              </div>
              {expenses.slice(0, 6).length === 0
                ? <p className="text-gray-400 text-sm text-center py-8">Sin gastos aún</p>
                : expenses.slice(0, 6).map(exp => (
                    <div key={exp.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 line-clamp-1">{exp.description}</p>
                        {exp.category && <p className="text-xs text-gray-400">{exp.category}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-red-600">-{cur}{exp.amount.toFixed(2)}</p>
                        <p className="text-xs text-gray-400">{fmt(exp.date)}</p>
                      </div>
                    </div>
                  ))
              }
            </div>
          </div>

          {expenses.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Gastos por categoría</h3>
              {(() => {
                const cats: Record<string, number> = {};
                expenses.forEach(e => { const c = e.category || "Sin categoría"; cats[c] = (cats[c] || 0) + e.amount; });
                const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1]);
                const max = sorted[0]?.[1] || 1;
                return (
                  <div className="space-y-3">
                    {sorted.map(([cat, amt]) => (
                      <div key={cat}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600">{cat}</span>
                          <span className="font-bold text-gray-900">{cur}{amt.toFixed(2)}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-orange-400 rounded-full" style={{ width: `${(amt / max) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* ===== FACTURAS / COTIZACIONES ===== */}
      {(tab === "invoices" || tab === "quotes") && (() => {
        const isInv = tab === "invoices";
        const list = invoices.filter(i => i.type === (isInv ? "invoice" : "quote"));
        return (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">{isInv ? "Facturas" : "Cotizaciones"}</h2>
              <button onClick={() => openAddInv(isInv ? "invoice" : "quote")}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm">
                + {isInv ? "Nueva Factura" : "Nueva Cotización"}
              </button>
            </div>

            {list.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <div className="text-5xl mb-3">{isInv ? "🧾" : "📋"}</div>
                <p className="font-semibold text-gray-500">Sin {isInv ? "facturas" : "cotizaciones"} aún</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Número</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Cliente</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Fecha</th>
                        {isInv && <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Vence</th>}
                        <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase">Total</th>
                        <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase">Estado</th>
                        <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map(inv => (
                        <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-gray-700 text-xs">{inv.number}</td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-gray-900">{inv.clientName}</p>
                            {inv.clientEmail && <p className="text-xs text-gray-400">{inv.clientEmail}</p>}
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{fmt(inv.createdAt)}</td>
                          {isInv && <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: inv.dueDate && new Date(inv.dueDate) < new Date() && inv.status !== "paid" ? "#dc2626" : "#6b7280" }}>{fmt(inv.dueDate)}</td>}
                          <td className="px-4 py-3 text-right font-bold text-gray-900">{cur}{inv.total.toFixed(2)}</td>
                          <td className="px-4 py-3 text-center"><Badge status={inv.status} /></td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1.5">
                              <button onClick={() => setViewInv(inv)} className="text-xs px-2 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600" title="Ver">👁</button>
                              <button onClick={() => openEditInv(inv)} className="text-xs px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold">Editar</button>
                              {inv.status === "draft" && isInv && (
                                <button onClick={() => changeStatus(inv, "sent")} className="text-xs px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold">Enviar</button>
                              )}
                              {inv.status === "sent" && isInv && (
                                <button onClick={() => changeStatus(inv, "paid")} className="text-xs px-2.5 py-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 font-semibold">✓ Pagado</button>
                              )}
                              {!isInv && ["draft", "sent"].includes(inv.status) && (
                                <button onClick={() => convertToInvoice(inv)} className="text-xs px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold">→ Factura</button>
                              )}
                              <button onClick={() => setDeleteConfirm({ type: "invoice", id: inv.id })} className="text-xs px-2 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500">🗑</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* ===== GASTOS ===== */}
      {tab === "expenses" && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Gastos</h2>
              <p className="text-sm text-gray-500 mt-0.5">Total: <span className="font-bold text-red-600">{cur}{totalExp.toFixed(2)}</span></p>
            </div>
            <button onClick={openAddExp}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold bg-orange-500 hover:bg-orange-600 transition-colors shadow-sm">
              + Nuevo Gasto
            </button>
          </div>
          {expenses.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-5xl mb-3">💸</div>
              <p className="font-semibold text-gray-500">Sin gastos registrados</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Fecha</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Descripción</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Categoría</th>
                      <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase">Monto</th>
                      <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map(exp => (
                      <tr key={exp.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{fmt(exp.date)}</td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900">{exp.description}</p>
                          {exp.notes && <p className="text-xs text-gray-400">{exp.notes}</p>}
                          {exp.receipt && <a href={exp.receipt} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline">🔗 Comprobante</a>}
                        </td>
                        <td className="px-4 py-3">
                          {exp.category ? <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">{exp.category}</span> : "—"}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-red-600">{cur}{exp.amount.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <button onClick={() => openEditExp(exp)} className="text-xs px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold">Editar</button>
                            <button onClick={() => setDeleteConfirm({ type: "expense", id: exp.id })} className="text-xs px-2 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500">🗑</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== INVENTARIO ===== */}
      {tab === "inventory" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">📦 Registrar Movimiento</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Producto</label>
                <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white"
                  value={logForm.productId} onChange={e => setLogForm(f => ({ ...f, productId: e.target.value }))}>
                  <option value="">Seleccionar...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock ?? "—"})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Tipo de movimiento</label>
                <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white"
                  value={logForm.type} onChange={e => setLogForm(f => ({ ...f, type: e.target.value as any }))}>
                  <option value="in">📥 Entrada (compra/recepción)</option>
                  <option value="out">📤 Salida (venta/uso)</option>
                  <option value="adjustment">🔧 Ajuste manual</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">{logForm.type === "adjustment" ? "Nuevo stock total" : "Cantidad"}</label>
                <input type="number" min={0}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                  value={logForm.quantity} onChange={e => setLogForm(f => ({ ...f, quantity: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Motivo (opcional)</label>
                <input type="text" placeholder="Ej: Compra proveedor XYZ..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                  value={logForm.reason} onChange={e => setLogForm(f => ({ ...f, reason: e.target.value }))} />
              </div>
            </div>
            <button onClick={saveLog} disabled={savingLog || !logForm.productId}
              className="mt-4 px-6 py-2.5 rounded-xl text-white text-sm font-bold bg-gray-800 hover:bg-gray-900 disabled:opacity-60 transition-colors">
              {savingLog ? "Guardando..." : "Registrar Movimiento"}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Resumen de Stock</h3>
              {products.length === 0 ? <p className="text-gray-400 text-sm">Sin productos.</p> : (
                <div className="space-y-2">
                  {products.map(p => (
                    <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <p className="text-sm font-semibold text-gray-900 truncate flex-1">{p.name}</p>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <span className="text-sm font-bold text-gray-900">{p.stock ?? "—"}</span>
                        {p.stock === null ? <span className="text-xs text-gray-400">—</span>
                          : p.stock === 0 ? <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs font-bold">0</span>
                          : <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs font-bold">OK</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Historial de movimientos</h3>
              {invLogs.length === 0 ? <p className="text-gray-400 text-sm">Sin movimientos.</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2 px-2 font-bold text-gray-500 uppercase">Fecha</th>
                        <th className="text-left py-2 px-2 font-bold text-gray-500 uppercase">Producto</th>
                        <th className="text-center py-2 px-2 font-bold text-gray-500 uppercase">Tipo</th>
                        <th className="text-center py-2 px-2 font-bold text-gray-500 uppercase">Cant.</th>
                        <th className="text-center py-2 px-2 font-bold text-gray-500 uppercase">Ant.</th>
                        <th className="text-center py-2 px-2 font-bold text-gray-500 uppercase">Nuevo</th>
                        <th className="text-left py-2 px-2 font-bold text-gray-500 uppercase">Motivo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invLogs.map(log => (
                        <tr key={log.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                          <td className="py-2 px-2 text-gray-500 whitespace-nowrap">{fmt(log.createdAt)}</td>
                          <td className="py-2 px-2 font-semibold text-gray-900 max-w-[120px] truncate">{log.productName}</td>
                          <td className="py-2 px-2 text-center">
                            <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${log.type === "in" ? "bg-green-100 text-green-700" : log.type === "out" ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-700"}`}>
                              {log.type === "in" ? "📥" : log.type === "out" ? "📤" : "🔧"} {log.type === "in" ? "Entrada" : log.type === "out" ? "Salida" : "Ajuste"}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-center font-bold">{log.type === "out" ? "-" : log.type === "in" ? "+" : "="}{log.quantity}</td>
                          <td className="py-2 px-2 text-center text-gray-500">{log.previousStock ?? "—"}</td>
                          <td className="py-2 px-2 text-center font-bold text-gray-900">{log.newStock ?? "—"}</td>
                          <td className="py-2 px-2 text-gray-500 max-w-[120px] truncate">{log.reason || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== CONFIG (SUPERADMIN ONLY) ===== */}
      {tab === "config" && isSuperAdmin && (
        <div className="max-w-2xl space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-5">⚙️ Configuración de Facturación</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Nombre de empresa (en facturas)</label>
                <input type="text" placeholder="Mi Empresa S.A."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                  value={cfgForm.companyName ?? ""} onChange={e => setCfgForm(f => ({ ...f, companyName: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">RTN / NIT / RUC</label>
                <input type="text" placeholder="0000-0000-000000"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                  value={cfgForm.taxId ?? ""} onChange={e => setCfgForm(f => ({ ...f, taxId: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Prefijo de facturas</label>
                <input type="text" placeholder="FAC"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                  value={cfgForm.invoicePrefix ?? ""} onChange={e => setCfgForm(f => ({ ...f, invoicePrefix: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Prefijo de cotizaciones</label>
                <input type="text" placeholder="COT"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                  value={cfgForm.quotePrefix ?? ""} onChange={e => setCfgForm(f => ({ ...f, quotePrefix: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Impuesto por defecto (%)</label>
                <input type="number" min={0} max={100} step={0.1} placeholder="0"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                  value={cfgForm.taxRate ?? ""} onChange={e => setCfgForm(f => ({ ...f, taxRate: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Símbolo de moneda</label>
                <input type="text" placeholder="$"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                  value={cfgForm.currency ?? ""} onChange={e => setCfgForm(f => ({ ...f, currency: e.target.value }))} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Términos de pago</label>
                <input type="text" placeholder="Pago a 30 días, transferencia bancaria..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                  value={cfgForm.paymentTerms ?? ""} onChange={e => setCfgForm(f => ({ ...f, paymentTerms: e.target.value }))} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Nota al pie de facturas</label>
                <textarea rows={2} placeholder="Gracias por su preferencia. Para consultas..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 resize-none"
                  value={cfgForm.invoiceFooter ?? ""} onChange={e => setCfgForm(f => ({ ...f, invoiceFooter: e.target.value }))} />
              </div>
            </div>
            <button onClick={saveCfg} disabled={savingCfg}
              className="mt-5 px-6 py-2.5 rounded-xl text-white text-sm font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition-colors">
              {savingCfg ? "Guardando..." : "Guardar configuración"}
            </button>
          </div>
        </div>
      )}

      {/* ===== DELETE CONFIRM ===== */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <p className="font-bold text-gray-900 text-lg mb-2">¿Confirmar eliminación?</p>
            <p className="text-gray-500 text-sm mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50">Cancelar</button>
              <button onClick={() => deleteConfirm.type === "invoice" ? deleteInv(deleteConfirm.id) : deleteExp(deleteConfirm.id)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== VIEW INVOICE ===== */}
      {viewInv && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-lg font-bold">{viewInv.number}</h2>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold">🖨 Imprimir</button>
                <button onClick={() => setViewInv(null)} className="text-gray-400 hover:text-gray-700 text-xl w-8">✕</button>
              </div>
            </div>
            <div className="p-8">
              <div className="flex justify-between items-start mb-8">
                <div>
                  {billingCfg.companyName && <p className="text-sm text-gray-500 mb-1">{billingCfg.companyName}</p>}
                  {billingCfg.taxId && <p className="text-xs text-gray-400 mb-3">RTN: {billingCfg.taxId}</p>}
                  <h1 className="text-3xl font-black text-gray-900">{viewInv.type === "invoice" ? "FACTURA" : "COTIZACIÓN"}</h1>
                  <p className="text-gray-500 font-mono text-sm mt-1">{viewInv.number}</p>
                </div>
                <div className="text-right">
                  <Badge status={viewInv.status} />
                  <p className="text-xs text-gray-400 mt-2">Emitida: {fmt(viewInv.createdAt)}</p>
                  {viewInv.dueDate && <p className="text-xs text-gray-400">Vence: {fmt(viewInv.dueDate)}</p>}
                  {viewInv.paidAt && <p className="text-xs text-green-600 font-bold">Pagada: {fmt(viewInv.paidAt)}</p>}
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Facturar a</p>
                <p className="font-bold text-gray-900 text-lg">{viewInv.clientName}</p>
                {viewInv.clientEmail && <p className="text-gray-600 text-sm">{viewInv.clientEmail}</p>}
                {viewInv.clientPhone && <p className="text-gray-600 text-sm">{viewInv.clientPhone}</p>}
                {viewInv.clientAddress && <p className="text-gray-600 text-sm">{viewInv.clientAddress}</p>}
              </div>

              <table className="w-full text-sm mb-6">
                <thead>
                  <tr className="bg-gray-900 text-white text-xs">
                    <th className="text-left px-4 py-3 rounded-tl-lg font-semibold">Descripción</th>
                    <th className="text-right px-4 py-3 font-semibold">Cant.</th>
                    <th className="text-right px-4 py-3 font-semibold">P. Unit.</th>
                    <th className="text-right px-4 py-3 rounded-tr-lg font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {parseItems(viewInv.items).map((item, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="px-4 py-3 text-gray-800">{item.description || "—"}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{item.qty}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{cur}{item.unitPrice.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">{cur}{item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="ml-auto max-w-xs space-y-2 text-sm mb-6">
                <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{cur}{viewInv.subtotal.toFixed(2)}</span></div>
                {viewInv.taxRate > 0 && <div className="flex justify-between text-gray-600"><span>Impuesto ({viewInv.taxRate}%)</span><span>{cur}{(viewInv.subtotal * viewInv.taxRate / 100).toFixed(2)}</span></div>}
                {viewInv.discount > 0 && <div className="flex justify-between text-gray-600"><span>Descuento</span><span>-{cur}{viewInv.discount.toFixed(2)}</span></div>}
                <div className="flex justify-between font-black text-xl text-gray-900 border-t border-gray-200 pt-2 mt-2"><span>TOTAL</span><span>{cur}{viewInv.total.toFixed(2)}</span></div>
              </div>

              {(viewInv.notes || billingCfg.paymentTerms || billingCfg.invoiceFooter) && (
                <div className="space-y-3">
                  {viewInv.notes && <div className="p-4 bg-gray-50 rounded-xl"><p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Notas</p><p className="text-sm text-gray-700">{viewInv.notes}</p></div>}
                  {billingCfg.paymentTerms && <p className="text-xs text-gray-400">Términos de pago: {billingCfg.paymentTerms}</p>}
                  {billingCfg.invoiceFooter && <p className="text-xs text-gray-500 text-center border-t border-gray-100 pt-3">{billingCfg.invoiceFooter}</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== INVOICE / QUOTE MODAL ===== */}
      {invModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10 rounded-t-3xl sm:rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-900">{editInv ? "Editar" : "Nueva"} {invForm.type === "invoice" ? "Factura" : "Cotización"}</h2>
              <button onClick={() => setInvModal(false)} className="text-gray-400 hover:text-gray-700 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-6">
              {/* Client */}
              <div>
                <p className="text-sm font-bold text-gray-700 mb-3">👤 Cliente</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Nombre <span className="text-red-500">*</span></label>
                    <input type="text" placeholder="Nombre del cliente"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                      value={invForm.clientName} onChange={e => setInvForm(f => ({ ...f, clientName: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Email</label>
                    <input type="email" placeholder="correo@ejemplo.com"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                      value={invForm.clientEmail} onChange={e => setInvForm(f => ({ ...f, clientEmail: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Teléfono</label>
                    <input type="text" placeholder="+000 0000-0000"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                      value={invForm.clientPhone} onChange={e => setInvForm(f => ({ ...f, clientPhone: e.target.value }))} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Dirección</label>
                    <input type="text" placeholder="Dirección del cliente"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                      value={invForm.clientAddress} onChange={e => setInvForm(f => ({ ...f, clientAddress: e.target.value }))} />
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-gray-700">📋 Artículos / Servicios</p>
                  <button onClick={() => setInvItems(items => [...items, { description: "", qty: 1, unitPrice: 0, total: 0 }])}
                    className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 transition-colors">
                    + Agregar fila
                  </button>
                </div>
                <div className="rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-xs">
                        <th className="text-left px-3 py-2.5 font-bold text-gray-500">Descripción</th>
                        <th className="text-right px-3 py-2.5 font-bold text-gray-500 w-16">Cant.</th>
                        <th className="text-right px-3 py-2.5 font-bold text-gray-500 w-28">P. Unit.</th>
                        <th className="text-right px-3 py-2.5 font-bold text-gray-500 w-24">Total</th>
                        <th className="w-7" />
                      </tr>
                    </thead>
                    <tbody>
                      {invItems.map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-100 last:border-0">
                          <td className="px-2 py-2">
                            <input type="text" placeholder="Descripción..."
                              className="w-full border-0 outline-none text-sm text-gray-900 bg-transparent"
                              value={item.description} onChange={e => updateItem(idx, { description: e.target.value })} />
                          </td>
                          <td className="px-2 py-2">
                            <input type="number" min={0} step={1}
                              className="w-full border-0 outline-none text-sm text-right text-gray-900 bg-transparent"
                              value={item.qty} onChange={e => updateItem(idx, { qty: Number(e.target.value) })} />
                          </td>
                          <td className="px-2 py-2">
                            <div className="flex items-center justify-end gap-1">
                              <span className="text-gray-400 text-xs">{cur}</span>
                              <input type="number" min={0} step={0.01}
                                className="w-full border-0 outline-none text-sm text-right text-gray-900 bg-transparent"
                                value={item.unitPrice} onChange={e => updateItem(idx, { unitPrice: Number(e.target.value) })} />
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right font-semibold text-gray-900 text-xs">{cur}{item.total.toFixed(2)}</td>
                          <td className="px-2 py-2">
                            {invItems.length > 1 && (
                              <button onClick={() => setInvItems(items => items.filter((_, i) => i !== idx))}
                                className="text-gray-300 hover:text-red-500 text-xs font-bold transition-colors">✕</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals + settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Impuesto (%)</label>
                      <input type="number" min={0} max={100} step={0.1} placeholder="0"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                        value={invForm.taxRate} onChange={e => setInvForm(f => ({ ...f, taxRate: Number(e.target.value) }))} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Descuento ({cur})</label>
                      <input type="number" min={0} step={0.01} placeholder="0.00"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                        value={invForm.discount} onChange={e => setInvForm(f => ({ ...f, discount: Number(e.target.value) }))} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Fecha de vencimiento</label>
                    <input type="date"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                      value={invForm.dueDate} onChange={e => setInvForm(f => ({ ...f, dueDate: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Estado</label>
                    <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
                      value={invForm.status} onChange={e => setInvForm(f => ({ ...f, status: e.target.value }))}>
                      <option value="draft">Borrador</option>
                      <option value="sent">Enviado</option>
                      <option value="paid">Pagado</option>
                      <option value="cancelled">Cancelado</option>
                      {invForm.type === "quote" && <option value="accepted">Aceptado</option>}
                      {invForm.type === "quote" && <option value="rejected">Rechazado</option>}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Notas</label>
                    <textarea rows={2} placeholder="Instrucciones de pago, condiciones..."
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none"
                      value={invForm.notes} onChange={e => setInvForm(f => ({ ...f, notes: e.target.value }))} />
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-5 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>{cur}{sub.toFixed(2)}</span></div>
                    {invForm.taxRate > 0 && <div className="flex justify-between text-sm text-gray-600"><span>Impuesto ({invForm.taxRate}%)</span><span>{cur}{tax.toFixed(2)}</span></div>}
                    {invForm.discount > 0 && <div className="flex justify-between text-sm text-gray-600"><span>Descuento</span><span>-{cur}{Number(invForm.discount).toFixed(2)}</span></div>}
                    <div className="flex justify-between font-black text-2xl text-gray-900 border-t border-gray-200 pt-3 mt-2">
                      <span>Total</span><span>{cur}{invTotal.toFixed(2)}</span>
                    </div>
                  </div>
                  <button onClick={saveInv} disabled={savingInv || !invForm.clientName.trim()}
                    className="mt-5 w-full py-3.5 rounded-xl text-white font-bold text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-sm">
                    {savingInv ? "Guardando..." : editInv ? "Guardar cambios" : `Crear ${invForm.type === "invoice" ? "Factura" : "Cotización"}`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== EXPENSE MODAL ===== */}
      {expModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10 rounded-t-3xl sm:rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-900">{editExp ? "Editar Gasto" : "Nuevo Gasto"}</h2>
              <button onClick={() => setExpModal(false)} className="text-gray-400 hover:text-gray-700 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Descripción <span className="text-red-500">*</span></label>
                <input type="text" placeholder="Ej: Pago de alquiler, compra de materiales..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                  value={expForm.description} onChange={e => setExpForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Monto <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{cur}</span>
                    <input type="number" min={0} step={0.01} placeholder="0.00"
                      className="w-full border border-gray-200 rounded-xl pl-7 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                      value={expForm.amount} onChange={e => setExpForm(f => ({ ...f, amount: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Fecha</label>
                  <input type="date"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                    value={expForm.date} onChange={e => setExpForm(f => ({ ...f, date: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Categoría</label>
                <input type="text" placeholder="Ej: Alquiler, Suministros, Nómina..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                  value={expForm.category} onChange={e => setExpForm(f => ({ ...f, category: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">URL del Comprobante</label>
                <input type="url" placeholder="https://..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                  value={expForm.receipt} onChange={e => setExpForm(f => ({ ...f, receipt: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notas</label>
                <textarea rows={2} placeholder="Observaciones adicionales..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 resize-none"
                  value={expForm.notes} onChange={e => setExpForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <button onClick={saveExp} disabled={savingExp || !expForm.description.trim() || !expForm.amount}
                className="w-full py-3.5 rounded-xl text-white font-bold text-sm bg-orange-500 hover:bg-orange-600 disabled:opacity-60 transition-colors">
                {savingExp ? "Guardando..." : editExp ? "Guardar cambios" : "Registrar Gasto"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
