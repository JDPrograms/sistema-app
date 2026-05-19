import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, appointmentReminderHtml } from "@/lib/email";

export async function GET(req: Request) {
  // Vercel cron sends the Authorization header
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find all pending/confirmed appointments for tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0]; // YYYY-MM-DD

  const appointments = await prisma.siteAppointment.findMany({
    where: { date: tomorrowStr, status: { in: ["pending", "confirmed"] } },
    include: { site: { select: { name: true, phone: true, emailApiKey: true, emailFrom: true } } },
  });

  let sent = 0;
  for (const appt of appointments) {
    if (!appt.clientEmail) continue;
    try {
      await sendEmail({
        apiKey: appt.site.emailApiKey,
        from: appt.site.emailFrom,
        to: appt.clientEmail,
        subject: `Recordatorio: cita mañana — ${appt.site.name}`,
        html: appointmentReminderHtml({
          clientName: appt.clientName,
          serviceName: appt.serviceName,
          staffName: appt.staffName,
          date: appt.date,
          time: appt.time,
          businessName: appt.site.name,
          businessPhone: appt.site.phone,
        }),
      });
      sent++;
    } catch (e) {
      console.error(`Reminder failed for appt ${appt.id}:`, e);
    }
  }

  return NextResponse.json({ ok: true, sent, total: appointments.length });
}
