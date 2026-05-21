import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

async function checkAdmin(slug: string, session: any) {
  const site = await prisma.site.findUnique({ where: { slug } });
  if (!site) return null;
  const role = session?.user?.role;
  if (role === "superadmin") return site;
  if (role === "siteadmin" && session.user.siteSlug === slug) return site;
  return null;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  const site = await checkAdmin(slug, session);
  if (!site) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [totalUsers, totalAppointments, totalInvoices, revenueResult, totalReviews, avgRatingResult] = await prisma.$transaction([
    prisma.siteUser.count({ where: { siteId: site.id } }),
    prisma.siteAppointment.count({ where: { siteId: site.id } }),
    prisma.siteInvoice.count({ where: { siteId: site.id, status: "paid" } }),
    prisma.siteInvoice.aggregate({ where: { siteId: site.id, status: "paid" }, _sum: { total: true } }),
    prisma.siteReview.count({ where: { siteId: site.id, isApproved: true } }),
    prisma.siteReview.aggregate({ where: { siteId: site.id, isApproved: true }, _avg: { rating: true } }),
  ]);

  return NextResponse.json({
    totalUsers,
    totalAppointments,
    totalPaidInvoices: totalInvoices,
    totalRevenue: revenueResult._sum.total ?? 0,
    totalReviews,
    avgRating: avgRatingResult._avg.rating ? Math.round(avgRatingResult._avg.rating * 10) / 10 : null,
  });
}
