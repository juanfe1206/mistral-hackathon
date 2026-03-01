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

async function main() {
  // Create default tenant if needed
  let tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: { name: "Default Tenant" },
    });
    console.log("Created default tenant:", tenant.id);
  }

  const existing = await prisma.lead.count({ where: { tenantId: tenant.id } });
  if (existing > 0) {
    console.log(`Tenant already has ${existing} leads, skipping seed`);
    return;
  }

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

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
