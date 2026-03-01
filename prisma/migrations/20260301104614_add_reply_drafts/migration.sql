-- CreateEnum
CREATE TYPE "ReplyDraftStatus" AS ENUM ('draft', 'approved', 'sent');

-- CreateTable
CREATE TABLE "reply_drafts" (
    "id" UUID NOT NULL,
    "lead_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "draft_text" TEXT NOT NULL,
    "status" "ReplyDraftStatus" NOT NULL DEFAULT 'draft',
    "approved_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "actor_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reply_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_reply_drafts_lead_id" ON "reply_drafts"("lead_id");

-- CreateIndex
CREATE INDEX "idx_reply_drafts_tenant_id" ON "reply_drafts"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_reply_drafts_status" ON "reply_drafts"("status");

-- AddForeignKey
ALTER TABLE "reply_drafts" ADD CONSTRAINT "reply_drafts_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
