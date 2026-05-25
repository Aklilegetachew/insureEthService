-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "InsuranceProduct" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "basePremium" DECIMAL(12,2),
    "premiumRate" DECIMAL(8,4),
    "coverageDescription" TEXT,
    "requiredDocuments" JSONB,
    "termsAndConditions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsuranceProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InsuranceProduct_code_key" ON "InsuranceProduct"("code");

-- CreateIndex
CREATE INDEX "InsuranceProduct_category_idx" ON "InsuranceProduct"("category");

-- CreateIndex
CREATE INDEX "InsuranceProduct_status_idx" ON "InsuranceProduct"("status");

-- CreateIndex
CREATE INDEX "InsuranceProduct_code_idx" ON "InsuranceProduct"("code");
