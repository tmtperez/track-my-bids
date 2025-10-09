-- AlterTable
ALTER TABLE "Bid" ADD COLUMN     "lastModifiedAt" TIMESTAMP(3),
ADD COLUMN     "lastModifiedById" INTEGER;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_lastModifiedById_fkey" FOREIGN KEY ("lastModifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
