-- Migration 1 added slots.updated_at but missed created_at, which the schema
-- also declares. Purely additive fix.
ALTER TABLE "slots" ADD COLUMN "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now();
