export function LoadingSpinner({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = { sm: "w-4 h-4 border-2", md: "w-6 h-6 border-2", lg: "w-8 h-8 border-[3px]" };
  return (
    <div
      className={`${sizes[size]} rounded-full border-gray-200 dark:border-slate-600 border-t-blue-600 dark:border-t-blue-400 animate-spin ${className}`}
    />
  );
}

export function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-64">
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-gray-400 dark:text-slate-500">Cargando...</p>
      </div>
    </div>
  );
}

export function InlineLoader({ text = "Guardando..." }: { text?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
      <LoadingSpinner size="sm" />
      {text}
    </span>
  );
}
