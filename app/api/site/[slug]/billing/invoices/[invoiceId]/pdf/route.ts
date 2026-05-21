import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function canAccess(session: any, slug: string) {
  const role = session?.user?.role;
  if (!session || (role !== "superadmin" && role !== "siteadmin")) return false;
  if (role === "siteadmin" && session.user.siteSlug !== slug) return false;
  return true;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string; invoiceId: string }> }
) {
  const { slug, invoiceId } = await params;
  const session = await auth();
  if (!canAccess(session, slug)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const site = await prisma.site.findUnique({
    where: { slug },
    select: { id: true, name: true, email: true, phone: true, address: true },
  });
  if (!site) return NextResponse.json({ error: "Sitio no encontrado" }, { status: 404 });

  const invoice = await prisma.siteInvoice.findUnique({
    where: { id: invoiceId, siteId: site.id },
  });
  if (!invoice) return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });

  const isQuote = invoice.type === "quote";
  const docTitle = isQuote ? "Cotización" : "Factura";
  const items: Array<{ description: string; qty: number; price: number; total: number }> =
    JSON.parse(invoice.items || "[]");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Header
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(site.name, 14, 20);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  if (site.address) doc.text(site.address, 14, 27);
  if (site.phone) doc.text(`Tel: ${site.phone}`, 14, 32);
  if (site.email) doc.text(site.email, 14, 37);

  // Document title & number
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(37, 99, 235);
  doc.text(`${docTitle} #${invoice.number}`, 130, 20, { align: "right" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`Fecha: ${new Date(invoice.createdAt).toLocaleDateString("es")}`, 196, 27, { align: "right" });
  if (invoice.dueDate) {
    doc.text(`Vence: ${new Date(invoice.dueDate).toLocaleDateString("es")}`, 196, 32, { align: "right" });
  }

  const statusLabels: Record<string, string> = {
    draft: "Borrador", sent: "Enviada", paid: "Pagada", cancelled: "Cancelada",
    accepted: "Aceptada", rejected: "Rechazada",
  };
  doc.text(`Estado: ${statusLabels[invoice.status] ?? invoice.status}`, 196, 37, { align: "right" });

  // Divider
  doc.setDrawColor(229, 231, 235);
  doc.line(14, 44, 196, 44);

  // Bill To
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30);
  doc.text("Facturar a:", 14, 52);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(60);
  doc.text(invoice.clientName, 14, 58);
  if (invoice.clientEmail) doc.text(invoice.clientEmail, 14, 63);
  if (invoice.clientPhone) doc.text(invoice.clientPhone, 14, 68);
  if (invoice.clientAddress) doc.text(invoice.clientAddress, 14, 73);

  // Items table
  const tableStartY = invoice.clientAddress ? 80 : 76;
  autoTable(doc, {
    startY: tableStartY,
    head: [["Descripción", "Cant.", "Precio unit.", "Total"]],
    body: items.map((it) => [
      it.description,
      String(it.qty),
      `$${Number(it.price).toLocaleString("es", { minimumFractionDigits: 2 })}`,
      `$${Number(it.total).toLocaleString("es", { minimumFractionDigits: 2 })}`,
    ]),
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 20, halign: "center" },
      2: { cellWidth: 35, halign: "right" },
      3: { cellWidth: 35, halign: "right" },
    },
    styles: { fontSize: 10, cellPadding: 3 },
    margin: { left: 14, right: 14 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 6;

  // Totals
  const totalsX = 130;
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("Subtotal:", totalsX, finalY);
  doc.text(`$${invoice.subtotal.toLocaleString("es", { minimumFractionDigits: 2 })}`, 196, finalY, { align: "right" });

  if (invoice.taxRate > 0) {
    doc.text(`ITBIS (${invoice.taxRate}%):`, totalsX, finalY + 6);
    const tax = invoice.subtotal * (invoice.taxRate / 100);
    doc.text(`$${tax.toLocaleString("es", { minimumFractionDigits: 2 })}`, 196, finalY + 6, { align: "right" });
  }
  if (invoice.discount > 0) {
    doc.text("Descuento:", totalsX, finalY + 12);
    doc.text(`-$${invoice.discount.toLocaleString("es", { minimumFractionDigits: 2 })}`, 196, finalY + 12, { align: "right" });
  }

  const totalY = finalY + (invoice.taxRate > 0 || invoice.discount > 0 ? 20 : 10);
  doc.setDrawColor(229, 231, 235);
  doc.line(totalsX, totalY - 4, 196, totalY - 4);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30);
  doc.text("TOTAL:", totalsX, totalY);
  doc.setTextColor(37, 99, 235);
  doc.text(`$${invoice.total.toLocaleString("es", { minimumFractionDigits: 2 })}`, 196, totalY, { align: "right" });

  // Notes
  if (invoice.notes) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(130);
    doc.text("Notas:", 14, totalY + 14);
    doc.text(invoice.notes, 14, totalY + 20, { maxWidth: 120 });
  }

  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  const filename = `${docTitle.toLowerCase()}-${invoice.number}.pdf`;

  return new Response(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
