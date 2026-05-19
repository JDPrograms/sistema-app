"use client";
import { useEffect } from "react";
import { signIn } from "next-auth/react";
import { useParams, useSearchParams, useRouter } from "next/navigation";

export default function GoogleCompletePage() {
  const { slug } = useParams() as { slug: string };
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("t");
  const role = searchParams.get("role") || "user";

  useEffect(() => {
    if (!token || !slug) {
      router.replace(`/site/${slug}/login?error=google`);
      return;
    }
    const provider = role === "admin" ? "google-siteadmin" : "google-siteuser";
    const redirectTo = role === "admin" ? `/site/${slug}/admin` : `/site/${slug}/portal`;

    signIn(provider, { token, siteSlug: slug, redirect: false }).then((res) => {
      if (res?.ok) {
        router.replace(redirectTo);
      } else {
        router.replace(`/site/${slug}/login?error=google`);
      }
    });
  }, [token, slug, role, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-500 text-sm">Iniciando sesión con Google...</p>
      </div>
    </div>
  );
}
