import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_START = "08:00";
const DEFAULT_END   = "19:30";

function toMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function generateSlots(start: string, end: string): string[] {
  const slots: string[] = [];
  for (let min = toMinutes(start); min < toMinutes(end); min += 30) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
  return slots;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { searchParams } = new URL(req.url);
  const date    = searchParams.get("date");     // YYYY-MM-DD
  const staffId = searchParams.get("staffId");  // optional

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "date requerido (YYYY-MM-DD)" }, { status: 400 });
  }

  const site = await prisma.site.findUnique({ where: { slug }, select: { id: true, isActive: true } });
  if (!site || !site.isActive) return NextResponse.json({ slots: [] });

  // If no staff selected → return all default slots, no conflict check
  if (!staffId) {
    return NextResponse.json({
      slots: generateSlots(DEFAULT_START, DEFAULT_END).map((time) => ({ time, available: true })),
    });
  }

  // Verify staff belongs to this site
  const staff = await prisma.siteStaff.findFirst({
    where: { id: staffId, siteId: site.id, isActive: true },
    select: { id: true },
  });
  if (!staff) return NextResponse.json({ slots: [] });

  // Day of week for requested date (0 = Sunday … 6 = Saturday)
  const dayOfWeek = new Date(`${date}T12:00:00`).getDay();

  // Get staff working hours for that day
  const avail = await prisma.siteStaffAvailability.findUnique({
    where: { staffId_dayOfWeek: { staffId, dayOfWeek } },
  });

  // No availability configured for this day → staff doesn't work that day
  if (avail && !avail.isActive) return NextResponse.json({ slots: [] });

  const start = avail?.startTime ?? DEFAULT_START;
  const end   = avail?.endTime   ?? DEFAULT_END;
  const allSlots = generateSlots(start, end);

  // Get already-booked times for this staff on this date (excluding cancelled)
  const booked = await prisma.siteAppointment.findMany({
    where: { siteId: site.id, staffId, date, status: { not: "cancelled" } },
    select: { time: true },
  });
  const bookedSet = new Set(booked.map((a) => a.time));

  return NextResponse.json({
    slots: allSlots.map((time) => ({ time, available: !bookedSet.has(time) })),
  });
}
