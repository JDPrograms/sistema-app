import { prisma } from "./prisma";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResult {
  text: string;
  provider: string;
}

async function tryGemini(apiKey: string, messages: Message[], systemPrompt: string): Promise<string> {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: systemPrompt,
    generationConfig: { maxOutputTokens: 500, temperature: 0.7 },
  });
  const rawHistory = messages.slice(0, -1).map((m) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }],
  }));
  // Gemini requires history to start with 'user'
  const firstUser = rawHistory.findIndex((m) => m.role === "user");
  const history = firstUser >= 0 ? rawHistory.slice(firstUser) : [];
  const chatSession = model.startChat({ history });
  const last = messages[messages.length - 1];
  const result = await chatSession.sendMessage(last.content);
  return result.response.text();
}

async function tryGroq(apiKey: string, messages: Message[], systemPrompt: string, model: string): Promise<string> {
  const Groq = (await import("groq-sdk")).default;
  const groq = new Groq({ apiKey });
  const res = await groq.chat.completions.create({
    model,
    messages: [{ role: "system", content: systemPrompt }, ...messages],
    max_tokens: 500,
    temperature: 0.7,
  });
  return res.choices[0]?.message?.content ?? "";
}

function isRateLimit(e: unknown): boolean {
  const err = e as { status?: number; statusCode?: number; message?: string };
  if (err?.status === 429 || err?.statusCode === 429) return true;
  const msg = String(err?.message ?? "").toLowerCase();
  return msg.includes("rate") || msg.includes("quota") || msg.includes("limit") || msg.includes("exhausted");
}

export async function chat(
  messages: Message[],
  systemPrompt: string,
  preferredProvider?: string | null
): Promise<ChatResult> {
  const providers = await prisma.aiProvider.findMany({
    where: { isActive: true, NOT: { apiKey: "" } },
    orderBy: { priority: "asc" },
  });

  type Attempt = { label: string; run: () => Promise<string> };
  const ordered = preferredProvider
    ? [...providers.filter((p) => p.name === preferredProvider), ...providers.filter((p) => p.name !== preferredProvider)]
    : providers;

  const attempts: Attempt[] = [];
  for (const p of ordered) {
    if (p.name === "gemini") {
      attempts.push({ label: "Gemini", run: () => tryGemini(p.apiKey, messages, systemPrompt) });
    } else if (p.name === "groq") {
      attempts.push({ label: "Groq (Llama)", run: () => tryGroq(p.apiKey, messages, systemPrompt, "llama-3.1-8b-instant") });
      attempts.push({ label: "Groq (Mixtral)", run: () => tryGroq(p.apiKey, messages, systemPrompt, "mixtral-8x7b-32768") });
    }
  }

  if (attempts.length === 0) {
    throw new Error("No hay proveedores de IA activos. El superadmin debe configurar al menos una API key.");
  }

  for (const attempt of attempts) {
    try {
      const text = await attempt.run();
      return { text, provider: attempt.label };
    } catch (e) {
      if (isRateLimit(e)) continue;
      throw e;
    }
  }

  throw new Error("Todos los proveedores de IA alcanzaron su limite. Intenta en unos minutos.");
}

const TEMPLATE_LABELS: Record<string, string> = {
  barbershop: "Peluqueria / Barberia",
  hardware: "Ferreteria / Tienda",
  restaurant: "Restaurante / Cafeteria",
  generic: "Negocio general",
};

const FORMAT_RULES = "REGLAS: Responde en español. Texto plano sin asteriscos, sin guiones de lista, sin numeracion, sin markdown. Respuestas cortas y directas (max 3 oraciones salvo que pidan mas detalle). Eres el asistente de este negocio especifico.";

export async function buildPublicContext(slug: string, agentSystemPrompt: string): Promise<string> {
  const site = await prisma.site.findUnique({
    where: { slug },
    include: {
      services: { where: { isActive: true }, orderBy: { createdAt: "asc" } },
      products: { where: { isActive: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!site) return agentSystemPrompt;

  const lines: string[] = [
    "=== INFORMACION DEL NEGOCIO ===",
    `Nombre: ${site.name}`,
    `Tipo: ${TEMPLATE_LABELS[site.template] ?? site.template}`,
  ];

  if (site.description) lines.push(`Descripcion: ${site.description}`);
  if (site.phone) lines.push(`Telefono: ${site.phone}`);
  if (site.email) lines.push(`Email: ${site.email}`);
  if (site.address) lines.push(`Direccion: ${site.address}`);

  if (site.services.length > 0) {
    lines.push("Servicios:");
    site.services.forEach((s) => {
      let line = `  ${s.name}`;
      if (s.price) line += ` $${s.price}`;
      if (s.duration) line += ` ${s.duration}min`;
      if (s.description) line += ` - ${s.description}`;
      lines.push(line);
    });
  }

  if (site.products.length > 0) {
    lines.push("Productos:");
    site.products.forEach((p) => {
      let line = `  ${p.name}`;
      if (p.price) line += ` $${p.price}`;
      if (p.category) line += ` [${p.category}]`;
      lines.push(line);
    });
  }

  lines.push("=== FIN ===");
  lines.push(FORMAT_RULES);

  return agentSystemPrompt + "\n\n" + lines.join("\n");
}

export async function buildAdminContext(slug: string, agentSystemPrompt: string): Promise<string> {
  const site = await prisma.site.findUnique({
    where: { slug },
    include: {
      services: { where: { isActive: true }, orderBy: { createdAt: "asc" } },
      products: { where: { isActive: true }, orderBy: { createdAt: "asc" } },
      staff: { where: { isActive: true }, orderBy: { name: "asc" } },
      _count: { select: { users: true, ads: true, appointments: true } },
    },
  });
  if (!site) return agentSystemPrompt;

  const [pendingAppts, todayAppts] = await Promise.all([
    prisma.siteAppointment.count({ where: { siteId: site.id, status: "pending" } }),
    prisma.siteAppointment.count({
      where: { siteId: site.id, date: new Date().toISOString().split("T")[0] },
    }),
  ]);

  const recentAppts = await prisma.siteAppointment.findMany({
    where: { siteId: site.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { clientName: true, serviceName: true, date: true, time: true, status: true, staffName: true },
  });

  const lines: string[] = [
    "=== PANEL DE ADMINISTRACION - CONTEXTO COMPLETO ===",
    `Negocio: ${site.name}`,
    `Tipo: ${TEMPLATE_LABELS[site.template] ?? site.template}`,
  ];

  if (site.description) lines.push(`Descripcion: ${site.description}`);
  if (site.phone) lines.push(`Telefono: ${site.phone}`);
  if (site.email) lines.push(`Email: ${site.email}`);
  if (site.address) lines.push(`Direccion: ${site.address}`);

  lines.push(`\nEstadisticas actuales:`);
  lines.push(`  Citas totales: ${site._count.appointments} | Pendientes: ${pendingAppts} | Hoy: ${todayAppts}`);
  lines.push(`  Usuarios registrados: ${site._count.users}`);
  lines.push(`  Anuncios activos: ${site._count.ads}`);
  lines.push(`  Personal activo: ${site.staff.length}`);

  if (site.staff.length > 0) {
    lines.push("\nPersonal:");
    site.staff.forEach((m) => {
      let line = `  ${m.name}`;
      if (m.specialty) line += ` (${m.specialty})`;
      if (m.email) line += ` - ${m.email}`;
      lines.push(line);
    });
  }

  if (site.services.length > 0) {
    lines.push("\nServicios activos:");
    site.services.forEach((s) => {
      let line = `  ${s.name}`;
      if (s.price) line += ` $${s.price}`;
      if (s.duration) line += ` ${s.duration}min`;
      if (s.description) line += ` - ${s.description}`;
      lines.push(line);
    });
  }

  if (site.products.length > 0) {
    lines.push("\nProductos activos:");
    site.products.forEach((p) => {
      let line = `  ${p.name}`;
      if (p.price) line += ` $${p.price}`;
      if (p.category) line += ` [${p.category}]`;
      if (p.stock !== null && p.stock !== undefined) line += ` stock:${p.stock}`;
      lines.push(line);
    });
  }

  if (recentAppts.length > 0) {
    lines.push("\nUltimas 5 citas:");
    recentAppts.forEach((a) => {
      lines.push(`  ${a.clientName} - ${a.serviceName ?? "sin servicio"} - ${a.date} ${a.time} [${a.status}]${a.staffName ? ` con ${a.staffName}` : ""}`);
    });
  }

  lines.push("=== FIN DEL CONTEXTO ADMIN ===");
  lines.push(FORMAT_RULES);

  return agentSystemPrompt + "\n\n" + lines.join("\n");
}
