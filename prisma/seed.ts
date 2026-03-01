import { PrismaClient } from "../src/generated/prisma/client/client";
import { PrismaPg } from "@prisma/adapter-pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required for seeding");
  process.exit(1);
}

const adapter = new PrismaPg({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter });

const SEED_DEMO = process.env.SEED_DEMO === "1" || process.env.SEED_DEMO === "true";

const MOCK_LEADS = [
  {
    sourceExternalId: "15551234567",
    sourceMetadata: {
      message_id: "wamid.mock1",
      timestamp: "1709123456",
      contact_name: "María García",
      phone_number_id: "123456789",
    },
  },
  {
    sourceExternalId: "15559876543",
    sourceMetadata: {
      message_id: "wamid.mock2",
      timestamp: "1709123550",
      contact_name: "Carlos López",
      phone_number_id: "123456789",
    },
  },
  {
    sourceExternalId: "15551112233",
    sourceMetadata: {
      message_id: "wamid.mock3",
      timestamp: "1709123700",
      contact_name: null,
      phone_number_id: "123456789",
    },
  },
];

/**
 * Demo leads for Mistral API showcase.
 * NO pre-seeded classifications or reply drafts - those are generated live via Mistral
 * when the user clicks "Reclassify" or "Generate draft".
 */
const DEMO_LEADS: Array<{
  sourceExternalId: string;
  sourceMetadata: Record<string, unknown>;
  /** Message text for Mistral classification context (used in interaction payload) */
  messageText: string;
  lifecycleState: "default" | "at_risk" | "recovered" | "lost";
  minutesAgo: number;
  hasRiskPulse?: boolean;
  /** Recovered leads only: has sent reply (for KPI recovery_count) */
  hasSentReply?: boolean;
  replySentMinutesAfterLead?: number;
}> = [
  {
    sourceExternalId: "15551111111",
    sourceMetadata: { message_id: "wamid.d1", contact_name: "Ana Martínez", phone_number_id: "123" },
    messageText: "Hola! Soy clienta habitual de hace años. Necesito reservar para el sábado, es para un evento muy importante.",
    lifecycleState: "recovered",
    minutesAgo: 120,
    hasSentReply: true,
    replySentMinutesAfterLead: 2,
  },
  {
    sourceExternalId: "15552222222",
    sourceMetadata: { message_id: "wamid.d2", contact_name: "Roberto Díaz", phone_number_id: "123" },
    messageText: "URGENTE! Tengo que cambiar mi cita de hoy, es una emergencia. ¿Pueden atenderme en la tarde?",
    lifecycleState: "at_risk",
    minutesAgo: 45,
    hasRiskPulse: true,
  },
  {
    sourceExternalId: "15553333333",
    sourceMetadata: { message_id: "wamid.d3", contact_name: "Laura Sánchez", phone_number_id: "123" },
    messageText: "Buenos días, quiero información sobre precios para coloración y corte. Estoy comparando con otros salones.",
    lifecycleState: "recovered",
    minutesAgo: 90,
    hasSentReply: true,
    replySentMinutesAfterLead: 4,
  },
  {
    sourceExternalId: "15554444444",
    sourceMetadata: { message_id: "wamid.d4", contact_name: "Pedro Gómez", phone_number_id: "123" },
    messageText: "Hola, escribí hace 2 días preguntando por tratamientos y no me han respondido. Sigo muy interesado.",
    lifecycleState: "at_risk",
    minutesAgo: 60,
    hasRiskPulse: true,
  },
  {
    sourceExternalId: "15555555555",
    sourceMetadata: { message_id: "wamid.d5", contact_name: "Carmen Ruiz", phone_number_id: "123" },
    messageText: "Necesito una cita para un tratamiento de keratina esta semana. Primera vez que vengo, me recomendaron.",
    lifecycleState: "default",
    minutesAgo: 35,
  },
  {
    sourceExternalId: "15556666666",
    sourceMetadata: { message_id: "wamid.d6", contact_name: "Javier López", phone_number_id: "123" },
    messageText: "Hola, una consulta rápida: ¿tienen Wi-Fi?",
    lifecycleState: "default",
    minutesAgo: 25,
  },
  {
    sourceExternalId: "15557777777",
    sourceMetadata: { message_id: "wamid.d7", contact_name: "Elena Torres", phone_number_id: "123" },
    messageText: "Hola Elena! Soy Elena, vengo cada mes. Quiero reservar mi próximo corte y también probar el tratamiento nuevo que mencionaron.",
    lifecycleState: "default",
    minutesAgo: 8,
  },
  {
    sourceExternalId: "15558888888",
    sourceMetadata: { message_id: "wamid.d8", contact_name: "Miguel Fernández", phone_number_id: "123" },
    messageText: "Gracias por responder! Sí me interesa, ¿puedo agendar para el jueves?",
    lifecycleState: "recovered",
    minutesAgo: 180,
    hasSentReply: true,
    replySentMinutesAfterLead: 6,
  },
  {
    sourceExternalId: "15559999999",
    sourceMetadata: { message_id: "wamid.d9", contact_name: "Sofia Herrera", phone_number_id: "123" },
    messageText: "Solo quería ver horarios de apertura, gracias.",
    lifecycleState: "default",
    minutesAgo: 15,
  },
  {
    sourceExternalId: "15550001111",
    sourceMetadata: { message_id: "wamid.d10", contact_name: "Diego Castro", phone_number_id: "123" },
    messageText: "Necesitamos 5 citas para el mismo día - es para una boda. ¿Tienen disponibilidad para un grupo?",
    lifecycleState: "default",
    minutesAgo: 50,
  },
  {
    sourceExternalId: "15550002222",
    sourceMetadata: { message_id: "wamid.d11", contact_name: "Isabel Mora", phone_number_id: "123" },
    messageText: "asdfghjkl",
    lifecycleState: "default",
    minutesAgo: 5,
  },
  {
    sourceExternalId: "15550003333",
    sourceMetadata: { message_id: "wamid.d12", contact_name: "Ricardo Vega", phone_number_id: "123" },
    messageText: "Hola, soy Ricardo. Hace 3 días pedí información sobre el paquete premium y nunca me contestaron. Era para un evento corporativo importante.",
    lifecycleState: "at_risk",
    minutesAgo: 90,
    hasRiskPulse: true,
  },
];

async function seedMinimal() {
  const tenant = await getOrCreateTenant();
  for (const lead of MOCK_LEADS) {
    await prisma.lead.create({
      data: {
        tenantId: tenant.id,
        sourceChannel: "whatsapp",
        sourceExternalId: lead.sourceExternalId,
        sourceMetadata: lead.sourceMetadata as object,
      },
    });
  }
  console.log(`Seeded ${MOCK_LEADS.length} mock leads`);
}

async function seedDemo() {
  const tenant = await getOrCreateTenant();

  // Clear existing demo data (cascade deletes related records)
  const deleted = await prisma.lead.deleteMany({ where: { tenantId: tenant.id } });
  if (deleted.count > 0) {
    console.log(`Cleared ${deleted.count} existing leads for demo reseed`);
  }

  const now = new Date();

  for (const d of DEMO_LEADS) {
    const createdAt = new Date(now.getTime() - d.minutesAgo * 60 * 1000);
    const lead = await prisma.lead.create({
      data: {
        tenantId: tenant.id,
        sourceChannel: "whatsapp",
        sourceExternalId: d.sourceExternalId,
        sourceMetadata: d.sourceMetadata as object,
        // No priority - stays default "low" until user clicks "Reclassify" (Mistral)
        lifecycleState: d.lifecycleState,
        createdAt,
      },
    });

    // Interaction for timeline + Mistral classification context
    await prisma.interaction.create({
      data: {
        leadId: lead.id,
        tenantId: tenant.id,
        eventType: "ingested",
        occurredAt: createdAt,
        payload: { ...d.sourceMetadata, text_body: d.messageText },
      },
    });

    // NO Classification - user clicks "Reclassify" to get priority/reason_tags via Mistral API

    // Risk pulse for at-risk leads (visible in UI)
    if (d.hasRiskPulse) {
      await prisma.riskPulse.create({
        data: {
          leadId: lead.id,
          tenantId: tenant.id,
          reason: "inactivity_threshold_exceeded",
          detectedAt: new Date(createdAt.getTime() + 45 * 60 * 1000),
          status: d.lifecycleState === "recovered" ? "recovered" : "active",
        },
      });
    }

    // Reply draft (sent) only for recovered leads - for KPI metrics.
    // At-risk leads: user clicks "Generate draft" to create via Mistral API.
    if (d.hasSentReply && d.replySentMinutesAfterLead != null) {
      const sentAt = new Date(createdAt.getTime() + d.replySentMinutesAfterLead * 60 * 1000);
      await prisma.replyDraft.create({
        data: {
          leadId: lead.id,
          tenantId: tenant.id,
          draftText: "¡Hola! Gracias por tu mensaje. ¿En qué podemos ayudarte hoy?",
          status: "sent",
          sentAt,
        },
      });
    }
  }

  console.log(
    `Seeded ${DEMO_LEADS.length} demo leads (no classifications - click Reclassify for Mistral). ` +
      `At-risk leads: use Generate draft for Mistral recovery.`
  );
}

async function getOrCreateTenant() {
  let tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: { name: "Default Tenant" },
    });
    console.log("Created default tenant:", tenant.id);
  }
  return tenant;
}

async function main() {
  const tenant = await getOrCreateTenant();
  const existing = await prisma.lead.count({ where: { tenantId: tenant.id } });

  if (SEED_DEMO) {
    await seedDemo();
    return;
  }

  if (existing > 0) {
    console.log(`Tenant already has ${existing} leads, skipping seed`);
    console.log("Tip: Set SEED_DEMO=1 to replace with a rich demo dataset (12 leads, KPIs, SLA, at-risk).");
    return;
  }

  await seedMinimal();
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
