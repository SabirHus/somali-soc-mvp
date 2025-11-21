-- CreateTable
CREATE TABLE "Attendee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "code" TEXT NOT NULL,
    "stripeSessionId" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "Attendee_code_key" ON "Attendee"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Attendee_stripeSessionId_key" ON "Attendee"("stripeSessionId");
