import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || (session.user as any).role !== "superadmin") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center font-bold text-lg">S</div>
            <div>
              <p className="font-bold text-sm">Sistema de Sistemas</p>
              <p className="text-xs text-slate-400">Super Admin</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium">
            Dashboard
          </Link>
          <Link href="/admin/sites" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium">
            Sitios web
          </Link>
          <Link href="/admin/sites/new" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium">
            + Crear sitio
          </Link>
          <div className="pt-2 border-t border-slate-700 mt-2">
            <Link href="/admin/ai" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium text-purple-300">
              🤖 Inteligencia Artificial
            </Link>
          </div>
        </nav>
        <div className="p-4 border-t border-slate-700">
          <p className="text-xs text-slate-400 mb-3">{session.user?.name}</p>
          <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
            <button type="submit" className="w-full text-left text-sm text-slate-400 hover:text-white transition-colors">
              Cerrar sesion
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
