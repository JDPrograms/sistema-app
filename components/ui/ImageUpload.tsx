"use client";
import { useRef, useState } from "react";

interface Props {
  value: string;
  onChange: (url: string) => void;
  slug?: string;
  label?: string;
  previewHeight?: string;
}

export default function ImageUpload({
  value,
  onChange,
  slug,
  label = "Imagen",
  previewHeight = "h-20",
}: Props) {
  const [mode, setMode] = useState<"url" | "upload">("url");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    if (slug) form.append("slug", slug);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (res.ok) {
        onChange(data.url);
      } else {
        setError(data.error || "Error al subir imagen");
      }
    } catch {
      setError("Error de conexion");
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  const inp =
    "w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <div className="flex gap-0.5 bg-gray-100 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
              mode === "url"
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            URL
          </button>
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
              mode === "upload"
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Subir archivo
          </button>
        </div>
      </div>

      {mode === "url" ? (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inp}
          placeholder="https://ejemplo.com/imagen.jpg"
        />
      ) : (
        <div
          onClick={() => !uploading && fileRef.current?.click()}
          className={`border-2 border-dashed border-gray-300 rounded-lg p-4 text-center transition-all ${
            uploading ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:border-blue-400 hover:bg-blue-50/40"
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />
          {uploading ? (
            <p className="text-sm text-blue-600 animate-pulse">Subiendo imagen...</p>
          ) : (
            <>
              <p className="text-xl mb-1">📁</p>
              <p className="text-sm text-gray-600 font-medium">Haz clic para elegir imagen</p>
              <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, GIF, WebP — max 5MB</p>
            </>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

      {value && (
        <div className="mt-2 relative inline-block">
          <img
            src={value}
            alt="preview"
            className={`${previewHeight} rounded-lg border border-gray-200 object-contain bg-gray-50`}
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 leading-none"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
