"use client";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useFormValidation, required, minLength } from "@/hooks/useFormValidation";
import { InlineLoader } from "@/components/ui/LoadingSpinner";
import { useState } from "react";

type FormValues = {
  title: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  category: string;
  authorName: string;
};

const RULES = {
  title: [required(), minLength(3)],
  content: [required("El contenido no puede estar vacío")],
};

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-red-500 mt-1">{msg}</p>;
}

export default function NewBlogPostPage() {
  const { slug } = useParams() as { slug: string };
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");

  const { values, errors, setValue, handleBlur, validate } = useFormValidation<FormValues>(
    { title: "", excerpt: "", content: "", imageUrl: "", category: "", authorName: "" },
    RULES,
  );

  async function handleSave(publish = false) {
    if (!validate()) return;
    setSaving(true);
    setServerError("");
    const res = await fetch(`/api/site/${slug}/blog`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, isPublished: publish }),
    });
    setSaving(false);
    if (res.ok) {
      const d = await res.json();
      router.replace(`/site/${slug}/admin/blog/${d.post.id}`);
    } else {
      setServerError("Error al guardar. Intenta de nuevo.");
    }
  }

  const inputCls = (field: keyof typeof errors) =>
    `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-slate-100 transition-colors ${
      errors[field]
        ? "border-red-400 dark:border-red-500"
        : "border-gray-300 dark:border-slate-600"
    }`;

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/site/${slug}/admin/blog`} className="text-sm text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300">← Volver</Link>
        <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">Nuevo artículo</h1>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            Título <span className="text-red-400">*</span>
          </label>
          <input
            value={values.title}
            onChange={(e) => setValue("title", e.target.value)}
            onBlur={() => handleBlur("title")}
            className={inputCls("title")}
          />
          <FieldError msg={errors.title} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Categoría</label>
            <input
              value={values.category}
              onChange={(e) => setValue("category", e.target.value)}
              className={inputCls("category")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Autor</label>
            <input
              value={values.authorName}
              onChange={(e) => setValue("authorName", e.target.value)}
              className={inputCls("authorName")}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">URL imagen destacada</label>
          <input
            value={values.imageUrl}
            onChange={(e) => setValue("imageUrl", e.target.value)}
            className={inputCls("imageUrl")}
            placeholder="https://..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Resumen</label>
          <textarea
            value={values.excerpt}
            onChange={(e) => setValue("excerpt", e.target.value)}
            rows={2}
            className={inputCls("excerpt")}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            Contenido <span className="text-red-400">*</span>
          </label>
          <textarea
            value={values.content}
            onChange={(e) => setValue("content", e.target.value)}
            onBlur={() => handleBlur("content")}
            rows={12}
            className={`${inputCls("content")} font-mono`}
            placeholder="<h2>Sección</h2><p>Contenido...</p>"
          />
          <FieldError msg={errors.content} />
        </div>

        <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-slate-700">
          {serverError && <span className="text-sm text-red-600">{serverError}</span>}
          {saving && <InlineLoader />}
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-5 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
          >
            Guardar borrador
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Publicar
          </button>
        </div>
      </div>
    </div>
  );
}
