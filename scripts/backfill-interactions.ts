/**
 * Backfill interactions for existing leads without an initial interaction.
 * For each lead with no interactions, creates one with occurred_at = lead.created_at
 * and payload = source_metadata if present, else { source: 'backfill' }.
 */
import "dotenv/config";
import { prisma } from "../src/lib/db";

async function main() {
  const leads = await prisma.lead.findMany({
    include: { _count: { select: { interactions: true } } },
  });
  const leadsWithoutInteractions = leads.filter((l) => l._count.interactions === 0);

  if (leadsWithoutInteractions.length === 0) {
    console.log("No leads need backfill.");
    return;
  }

  for (const lead of leadsWithoutInteractions) {
    const payload =
      lead.sourceMetadata && typeof lead.sourceMetadata === "object"
        ? (lead.sourceMetadata as Record<string, unknown>)
        : { source: "backfill" };
    await prisma.interaction.create({
      data: {
        leadId: lead.id,
        tenantId: lead.tenantId,
        eventType: "ingested",
        occurredAt: lead.createdAt,
        payload,
      },
    });
  }
  console.log(`Backfilled ${leadsWithoutInteractions.length} leads with initial interaction.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
