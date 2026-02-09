-- CreateEnum
CREATE TYPE "CustomerLedgerType" AS ENUM ('recharge', 'consume', 'adjust');

-- CreateTable
CREATE TABLE "CustomerLedger" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "type" "CustomerLedgerType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "balanceAfter" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "relatedId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerLedger_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CustomerLedger" ADD CONSTRAINT "CustomerLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerLedger" ADD CONSTRAINT "CustomerLedger_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
