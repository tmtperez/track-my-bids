/*
  Warnings:

  - You are about to drop the column `defaultCost` on the `Scope` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "ScopeCatalog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "defaultCost" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Scope" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "cost" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "bidId" INTEGER NOT NULL,
    CONSTRAINT "Scope_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "Bid" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Scope" ("bidId", "cost", "id", "name", "status") SELECT "bidId", "cost", "id", "name", "status" FROM "Scope";
DROP TABLE "Scope";
ALTER TABLE "new_Scope" RENAME TO "Scope";
CREATE INDEX "Scope_bidId_idx" ON "Scope"("bidId");
CREATE INDEX "Scope_status_idx" ON "Scope"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ScopeCatalog_name_key" ON "ScopeCatalog"("name");
