-- CreateTable
CREATE TABLE "PromiseReport" (
    "id" TEXT NOT NULL,
    "reporterName" TEXT,
    "accusedName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "datePromised" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visibleAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromiseReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PromiseReport_visibleAt_idx" ON "PromiseReport"("visibleAt");

-- CreateIndex
CREATE INDEX "PromiseReport_createdAt_idx" ON "PromiseReport"("createdAt");
