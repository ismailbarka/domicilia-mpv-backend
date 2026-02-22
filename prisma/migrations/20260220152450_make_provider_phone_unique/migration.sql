/*
  Warnings:

  - A unique constraint covering the columns `[phone]` on the table `Provider` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Provider_phone_key" ON "Provider"("phone");
