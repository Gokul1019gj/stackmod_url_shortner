-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "password_hash" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "urls" (
    "short_code" TEXT NOT NULL PRIMARY KEY,
    "original_url" TEXT NOT NULL,
    "user_id" TEXT,
    "expires_at" DATETIME,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "urls_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "click_events" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "short_code" TEXT NOT NULL,
    "ip_address" TEXT,
    "country" TEXT,
    "user_agent" TEXT,
    "clicked_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "click_events_short_code_fkey" FOREIGN KEY ("short_code") REFERENCES "urls" ("short_code") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "urls_user_id_idx" ON "urls"("user_id");

-- CreateIndex
CREATE INDEX "urls_is_active_idx" ON "urls"("is_active");

-- CreateIndex
CREATE INDEX "click_events_short_code_idx" ON "click_events"("short_code");

-- CreateIndex
CREATE INDEX "click_events_clicked_at_idx" ON "click_events"("clicked_at");

-- CreateIndex
CREATE INDEX "click_events_short_code_clicked_at_idx" ON "click_events"("short_code", "clicked_at");

-- CreateIndex
CREATE INDEX "click_events_ip_address_idx" ON "click_events"("ip_address");
