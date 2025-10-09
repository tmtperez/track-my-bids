-- AlterTable
ALTER TABLE "Bid" ADD COLUMN     "estimatorId" INTEGER;

-- CreateIndex
CREATE INDEX "Bid_estimatorId_idx" ON "Bid"("estimatorId");

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_estimatorId_fkey" FOREIGN KEY ("estimatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
