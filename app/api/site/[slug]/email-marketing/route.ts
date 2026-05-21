import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

async function checkAdmin(slug: string, session: any) {
  const site = await prisma.site.findUnique({ where: { slug } });
  if (!site) return null;
  const role = session?.user?.role;
  if (role === "superadmin") return site;
  if (role === "siteadmin" && session.user.siteSlug === slug) return site;
  return null;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  const site = await checkAdmin(slug, session) as any;
  if (!site) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { subject, html, targetType } = await req.json();
  if (!subject || !html) return NextResponse.json({ error: "Asunto y contenido requeridos" }, { status: 400 });

  const apiKey = site.emailApiKey || process.env.RESEND_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Email no configurado en este sitio" }, { status: 400 });

  let recipients: string[] = [];

  if (targetType === "newsletter") {
    const subs = await prisma.siteNewsletterSubscriber.findMany({
      where: { siteId: site.id, isActive: true },
      select: { email: true },
    });
    recipients = subs.map((s) => s.email);
  } else {
    const users = await prisma.siteUser.findMany({
      where: { siteId: site.id },
      select: { email: true },
    });
    recipients = users.map((u) => u.email);
  }

  if (recipients.length === 0) return NextResponse.json({ error: "No hay destinatarios" }, { status: 400 });

  const resend = new Resend(apiKey);
  const from = site.emailFrom || `${site.name} <noreply@resend.dev>`;

  // Send in batches of 50 (Resend limit per call)
  let sent = 0;
  for (let i = 0; i < recipients.length; i += 50) {
    const batch = recipients.slice(i, i + 50);
    await resend.emails.send({ from, to: batch, subject, html });
    sent += batch.length;
  }

  return NextResponse.json({ ok: true, sent });
}
