"use client";
import { useState } from "react";

interface Props {
  slug: string;
  variant?: "login" | "public" | "admin";
  label?: string;
  className?: string;
}

export default function CopySiteUrlBtn({ slug, variant = "login", label, className = "" }: Props) {
  const [copied, setCopied] = useState(false);

  function copy() {
    const origin = window.location.origin;
    const path =
      variant === "public" ? `/site/${slug}` :
      variant === "admin"  ? `/site/${slug}/admin` :
                             `/site/${slug}/login`;
    navigator.clipboard.writeText(`${origin}${path}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={copy}
      className={`text-xs font-medium border rounded-lg transition-colors px-3 py-1.5 ${
        copied
          ? "bg-green-50 text-green-700 border-green-200"
          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
      } ${className}`}
    >
      {copied ? "Copiado ✓" : (label ?? "Copiar URL")}
    </button>
  );
}
