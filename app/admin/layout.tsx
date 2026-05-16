import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { signOut } from "@/lib/auth";
import SuperAdminSidebar from "@/components/admin/SuperAdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || (session.user as any).role !== "superadmin") {
    redirect("/login");
  }

  const signOutSlot = (
    <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
      <button type="submit" className="w-full text-left text-sm text-slate-400 hover:text-white transition-colors">
        Cerrar sesion
      </button>
    </form>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <SuperAdminSidebar userName={session.user?.name ?? ""} signOutSlot={signOutSlot} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top spacer */}
        <div className="md:hidden h-14 flex-shrink-0 bg-slate-900 flex items-center justify-center px-14">
          <span className="font-bold text-sm text-white">Sistema de Sistemas</span>
        </div>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
