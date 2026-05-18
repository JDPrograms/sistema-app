import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.superAdmin.findUnique({ where: { email: "admin@sistema.com" } });
  if (!existing) {
    const password = await bcrypt.hash("admin123", 10);
    await prisma.superAdmin.create({
      data: { email: "admin@sistema.com", password, name: "Super Admin", isMaster: true },
    });
    console.log("Super admin creado: admin@sistema.com / admin123");
  } else {
    // ensure the initial admin is marked as master
    if (!existing.isMaster) {
      await prisma.superAdmin.update({ where: { id: existing.id }, data: { isMaster: true } });
      console.log("Super admin marcado como master.");
    } else {
      console.log("Super admin ya existe.");
    }
  }

  const geminiKey = process.env.GEMINI_API_KEY ?? "";
  const groqKey = process.env.GROQ_API_KEY ?? "";

  const gemini = await prisma.aiProvider.upsert({
    where: { name: "gemini" },
    create: { name: "gemini", label: "Google Gemini", priority: 0, isActive: !!geminiKey, apiKey: geminiKey },
    update: geminiKey ? { apiKey: geminiKey, isActive: true } : {},
  });

  const groq = await prisma.aiProvider.upsert({
    where: { name: "groq" },
    create: { name: "groq", label: "Groq", priority: 1, isActive: !!groqKey, apiKey: groqKey },
    update: groqKey ? { apiKey: groqKey, isActive: true } : {},
  });

  console.log(`Gemini: ${gemini.isActive ? "activo" : "inactivo"} | Groq: ${groq.isActive ? "activo" : "inactivo"}`);
  console.log("Proveedores IA inicializados.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
