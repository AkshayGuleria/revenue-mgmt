-- CreateTable
CREATE TABLE "contract_shares" (
    "id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "contract_shares_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contract_shares_contract_id_idx" ON "contract_shares"("contract_id");

-- CreateIndex
CREATE INDEX "contract_shares_account_id_idx" ON "contract_shares"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "contract_shares_contract_id_account_id_key" ON "contract_shares"("contract_id", "account_id");

-- AddForeignKey
ALTER TABLE "contract_shares" ADD CONSTRAINT "contract_shares_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_shares" ADD CONSTRAINT "contract_shares_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
