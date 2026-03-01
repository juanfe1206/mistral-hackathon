import { prisma } from "@/lib/db";

export interface RecordFailureInput {
  errorCode: string;
  message: string;
  details?: unknown[];
}

export async function recordIngestionFailure(input: RecordFailureInput) {
  return prisma.ingestionFailure.create({
    data: {
      errorCode: input.errorCode,
      message: input.message,
      details: input.details ? (input.details as object) : undefined,
    },
  });
}

export async function findRecentIngestionFailures(limit = 20) {
  return prisma.ingestionFailure.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
