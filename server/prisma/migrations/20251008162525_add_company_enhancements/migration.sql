-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "accountManagerId" INTEGER,
ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "customerSince" TIMESTAMP(3),
ADD COLUMN     "lastContactDate" TIMESTAMP(3),
ADD COLUMN     "nextFollowUpDate" TIMESTAMP(3),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "relationshipStatus" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "website" TEXT,
ADD COLUMN     "zip" TEXT;

-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "isPrimary" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "CompanyTag" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "tagName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyAttachment" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "originalName" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "mimetype" TEXT,
    "size" INTEGER,
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyActivityLog" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "activityType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "performedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompanyTag_companyId_idx" ON "CompanyTag"("companyId");

-- CreateIndex
CREATE INDEX "CompanyTag_tagName_idx" ON "CompanyTag"("tagName");

-- CreateIndex
CREATE INDEX "CompanyAttachment_companyId_idx" ON "CompanyAttachment"("companyId");

-- CreateIndex
CREATE INDEX "CompanyActivityLog_companyId_idx" ON "CompanyActivityLog"("companyId");

-- CreateIndex
CREATE INDEX "CompanyActivityLog_activityType_idx" ON "CompanyActivityLog"("activityType");

-- CreateIndex
CREATE INDEX "CompanyActivityLog_createdAt_idx" ON "CompanyActivityLog"("createdAt");

-- CreateIndex
CREATE INDEX "Company_accountManagerId_idx" ON "Company"("accountManagerId");

-- CreateIndex
CREATE INDEX "Company_relationshipStatus_idx" ON "Company"("relationshipStatus");

-- CreateIndex
CREATE INDEX "Company_nextFollowUpDate_idx" ON "Company"("nextFollowUpDate");

-- CreateIndex
CREATE INDEX "Contact_companyId_idx" ON "Contact"("companyId");

-- CreateIndex
CREATE INDEX "Contact_isPrimary_idx" ON "Contact"("isPrimary");

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_accountManagerId_fkey" FOREIGN KEY ("accountManagerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyTag" ADD CONSTRAINT "CompanyTag_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyAttachment" ADD CONSTRAINT "CompanyAttachment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyActivityLog" ADD CONSTRAINT "CompanyActivityLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
