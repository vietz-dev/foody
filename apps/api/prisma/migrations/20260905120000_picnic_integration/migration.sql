-- AlterTable
ALTER TABLE "ingredients" ADD COLUMN     "picnicProductId" TEXT,
ADD COLUMN     "picnicProductName" TEXT,
ADD COLUMN     "picnicUnitQuantity" TEXT;

-- CreateTable
CREATE TABLE "picnic_accounts" (
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL DEFAULT 'DE',
    "authKey" TEXT NOT NULL,
    "pendingTwoFactor" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "picnic_accounts_pkey" PRIMARY KEY ("userId")
);
