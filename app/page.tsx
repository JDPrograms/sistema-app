import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();
  if (session) {
    const role = (session.user as any).role;
    if (role === "superadmin") redirect("/admin");
    if (role === "siteadmin") redirect(`/site/${(session.user as any).siteSlug}/admin`);
    if (role === "siteuser") redirect(`/site/${(session.user as any).siteSlug}`);
  }
  redirect("/login");
}
