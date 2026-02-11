-- CreateEnum
CREATE TYPE "secret_status" AS ENUM ('STORED', 'AVAILABLE');

-- CreateEnum
CREATE TYPE "schedule_status" AS ENUM ('PENDING', 'PROCESSED', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "release_event_type" AS ENUM ('RELEASED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "secrets" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "title" VARCHAR(200),
    "description" VARCHAR(1000),
    "cipher_text" TEXT NOT NULL,
    "iv" VARCHAR(255) NOT NULL,
    "auth_tag" VARCHAR(255),
    "algorithm" VARCHAR(50) NOT NULL,
    "key_version" INTEGER NOT NULL DEFAULT 1,
    "status" "secret_status" NOT NULL DEFAULT 'STORED',
    "available_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "secrets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "secret_release_schedules" (
    "id" UUID NOT NULL,
    "secret_id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "scheduled_for" TIMESTAMPTZ(6) NOT NULL,
    "status" "schedule_status" NOT NULL DEFAULT 'PENDING',
    "correlation_id" VARCHAR(255),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "processed_at" TIMESTAMPTZ(6),
    "last_error" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "secret_release_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "secret_release_history" (
    "id" UUID NOT NULL,
    "secret_id" UUID NOT NULL,
    "schedule_id" UUID,
    "type" "release_event_type" NOT NULL DEFAULT 'RELEASED',
    "metadata_json" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "secret_release_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "secrets_owner_id_created_at_idx" ON "secrets"("owner_id", "created_at");

-- CreateIndex
CREATE INDEX "secrets_owner_id_idx" ON "secrets"("owner_id");

-- CreateIndex
CREATE INDEX "secrets_status_idx" ON "secrets"("status");

-- CreateIndex
CREATE INDEX "schedules_secret_id_idx" ON "secret_release_schedules"("secret_id");

-- CreateIndex
CREATE INDEX "schedules_owner_id_idx" ON "secret_release_schedules"("owner_id");

-- CreateIndex
CREATE INDEX "schedules_scheduled_for_idx" ON "secret_release_schedules"("scheduled_for");

-- CreateIndex
CREATE INDEX "schedules_status_scheduled_for_idx" ON "secret_release_schedules"("status", "scheduled_for");

-- CreateIndex
CREATE INDEX "schedules_correlation_id_idx" ON "secret_release_schedules"("correlation_id");

-- CreateIndex
CREATE INDEX "history_secret_id_created_at_idx" ON "secret_release_history"("secret_id", "created_at");

-- CreateIndex
CREATE INDEX "history_schedule_id_created_at_idx" ON "secret_release_history"("schedule_id", "created_at");

-- AddForeignKey
ALTER TABLE "secrets" ADD CONSTRAINT "secrets_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secret_release_schedules" ADD CONSTRAINT "secret_release_schedules_secret_id_fkey" FOREIGN KEY ("secret_id") REFERENCES "secrets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secret_release_schedules" ADD CONSTRAINT "secret_release_schedules_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secret_release_history" ADD CONSTRAINT "secret_release_history_secret_id_fkey" FOREIGN KEY ("secret_id") REFERENCES "secrets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secret_release_history" ADD CONSTRAINT "secret_release_history_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "secret_release_schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
