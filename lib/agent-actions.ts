import { prisma } from "./prisma";

const uid = () => Math.random().toString(36).slice(2, 9);

export interface ActionResult {
  ok: boolean;
  message: string;
}

export async function executeAgentAction(
  siteSlug: string,
  type: string,
  data: Record<string, any>
): Promise<ActionResult> {
  const site = await prisma.site.findUnique({ where: { slug: siteSlug } });
  if (!site) return { ok: false, message: "Sitio no encontrado" };

  switch (type) {
    case "update_site": {
      const update: any = {};
      if (data.name) update.name = data.name;
      if (data.description !== undefined) update.description = data.description || null;
      if (data.primaryColor) update.primaryColor = data.primaryColor;
      if (data.secondaryColor) update.secondaryColor = data.secondaryColor;
      if (data.logoUrl !== undefined) update.logoUrl = data.logoUrl || null;
      if (data.phone !== undefined) update.phone = data.phone || null;
      if (data.email !== undefined) update.email = data.email || null;
      if (data.address !== undefined) update.address = data.address || null;
      if (data.whatsapp !== undefined) update.whatsapp = data.whatsapp || null;
      if (Object.keys(update).length === 0) return { ok: false, message: "No hay datos para actualizar" };
      await prisma.site.update({ where: { id: site.id }, data: update });
      return { ok: true, message: "Sitio actualizado correctamente" };
    }

    case "create_service": {
      if (!data.name) return { ok: false, message: "El servicio necesita un nombre" };
      const service = await prisma.siteService.create({
        data: {
          siteId: site.id,
          name: data.name,
          description: data.description || null,
          price: data.price ? parseFloat(String(data.price)) : null,
          duration: data.duration ? parseInt(String(data.duration)) : null,
          imageUrl: data.imageUrl || null,
        },
      });
      return { ok: true, message: `Servicio "${service.name}" creado` };
    }

    case "update_service": {
      if (!data.id) return { ok: false, message: "Se necesita el ID del servicio" };
      const update: any = {};
      if (data.name) update.name = data.name;
      if (data.description !== undefined) update.description = data.description || null;
      if (data.price !== undefined) update.price = data.price ? parseFloat(String(data.price)) : null;
      if (data.duration !== undefined) update.duration = data.duration ? parseInt(String(data.duration)) : null;
      await prisma.siteService.update({ where: { id: data.id }, data: update });
      return { ok: true, message: `Servicio actualizado` };
    }

    case "create_product": {
      if (!data.name) return { ok: false, message: "El producto necesita un nombre" };
      const product = await prisma.siteProduct.create({
        data: {
          siteId: site.id,
          name: data.name,
          description: data.description || null,
          price: data.price ? parseFloat(String(data.price)) : null,
          stock: data.stock !== undefined && data.stock !== "" ? parseInt(String(data.stock)) : null,
          category: data.category || null,
          imageUrl: data.imageUrl || null,
        },
      });
      return { ok: true, message: `Producto "${product.name}" creado` };
    }

    case "create_ad": {
      if (!data.title) return { ok: false, message: "El anuncio necesita un titulo" };
      await prisma.siteAd.create({
        data: {
          siteId: site.id,
          title: data.title,
          description: data.description || null,
          imageUrl: data.imageUrl || null,
          linkUrl: data.linkUrl || null,
          buttonText: data.buttonText || null,
          type: data.type || "banner",
          order: data.order !== undefined ? parseInt(String(data.order)) : 0,
        },
      });
      return { ok: true, message: `Anuncio "${data.title}" creado` };
    }

    case "create_staff": {
      if (!data.name) return { ok: false, message: "El personal necesita un nombre" };
      await prisma.siteStaff.create({
        data: {
          siteId: site.id,
          name: data.name,
          specialty: data.specialty || null,
          email: data.email || null,
          phone: data.phone || null,
        },
      });
      return { ok: true, message: `Personal "${data.name}" agregado` };
    }

    case "add_page_block": {
      if (!data.blockType) return { ok: false, message: "Se necesita el tipo de bloque" };
      const raw = await prisma.$queryRaw<{ pageBlocks: string | null }[]>`
        SELECT "pageBlocks" FROM "Site" WHERE id = ${site.id}
      `;
      let blocks: any[] = [];
      try { blocks = JSON.parse(raw[0]?.pageBlocks || "[]"); } catch {}
      const block = {
        id: uid(),
        type: data.blockType,
        config: data.config || defaultBlockConfig(data.blockType),
        order: blocks.length,
      };
      blocks.push(block);
      await prisma.$executeRaw`UPDATE "Site" SET "pageBlocks" = ${JSON.stringify(blocks)} WHERE id = ${site.id}`;
      return { ok: true, message: `Seccion "${data.blockType}" agregada a la pagina` };
    }

    case "clear_page_blocks": {
      await prisma.$executeRaw`UPDATE "Site" SET "pageBlocks" = '[]' WHERE id = ${site.id}`;
      return { ok: true, message: "Secciones de la pagina eliminadas" };
    }

    default:
      return { ok: false, message: `Accion desconocida: ${type}` };
  }
}

function defaultBlockConfig(type: string): any {
  switch (type) {
    case "gallery":      return { title: "Nuestra galeria", images: [] };
    case "stats":        return { title: "Nuestros numeros", items: [{ value: "500+", label: "Clientes" }, { value: "10", label: "Anos de experiencia" }] };
    case "testimonials": return { title: "Lo que dicen de nosotros", items: [{ text: "Excelente servicio.", author: "Cliente satisfecho", role: "Cliente" }] };
    case "faq":          return { title: "Preguntas frecuentes", items: [{ q: "Como puedo reservar?", a: "Puedes reservar directamente desde la web." }] };
    case "cta":          return { title: "Contactanos hoy", subtitle: "Estamos para ayudarte", buttonText: "Contactar", buttonUrl: "" };
    case "text":         return { title: "Sobre nosotros", body: "Escribe aqui el contenido de esta seccion.", align: "center" };
    default:             return {};
  }
}
