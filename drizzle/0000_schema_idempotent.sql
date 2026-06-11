-- =============================================================================
-- Arc Options — Idempotent Schema Migration
-- Safe to run multiple times. All CREATE statements use IF NOT EXISTS or
-- exception-handling DO blocks so partial state doesn't cause errors.
-- =============================================================================

-- ─── Enums (wrapped to survive re-runs) ──────────────────────────────────────
DO $$ BEGIN CREATE TYPE "public"."adjustment_kind" AS ENUM('roll','partial_close','leg_add','strike_change','expiry_change');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE "public"."import_status" AS ENUM('pending','committed','failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE "public"."leg_side" AS ENUM('long','short');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE "public"."leg_type" AS ENUM('call','put');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE "public"."member_role" AS ENUM('owner','admin','member');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE "public"."plan" AS ENUM('free','pro');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE "public"."position_status" AS ENUM('open','closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Tables ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "workspaces" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(100) NOT NULL,
  "plan" "plan" DEFAULT 'free' NOT NULL,
  "stripe_customer_id" text,
  "stripe_subscription_id" text,
  "stripe_current_period_end" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "workspace_members" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workspace_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "role" "member_role" DEFAULT 'member' NOT NULL,
  "joined_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "broker_accounts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workspace_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "broker" varchar(50) NOT NULL,
  "label" varchar(100),
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "positions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workspace_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "broker_account_id" uuid,
  "symbol" varchar(10) NOT NULL,
  "strategy_name" varchar(100) NOT NULL,
  "status" "position_status" DEFAULT 'open' NOT NULL,
  "entry_thesis" text,
  "checklist_score" integer,
  "entry_credit" numeric(10, 4),
  "realized_pnl" numeric(10, 2),
  "return_on_risk" numeric(8, 4),
  "opened_at" timestamp DEFAULT now() NOT NULL,
  "closed_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "position_legs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "position_id" uuid NOT NULL,
  "type" "leg_type" NOT NULL,
  "side" "leg_side" NOT NULL,
  "strike" numeric(10, 2) NOT NULL,
  "expiration" timestamp NOT NULL,
  "qty" integer DEFAULT 1 NOT NULL,
  "open_price" numeric(10, 4),
  "close_price" numeric(10, 4),
  "closed_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "position_adjustments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "position_id" uuid NOT NULL,
  "kind" "adjustment_kind" NOT NULL,
  "premium_impact" numeric(10, 4),
  "note" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "tags" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workspace_id" uuid NOT NULL,
  "name" varchar(50) NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "position_tags" (
  "position_id" uuid NOT NULL,
  "tag_id" uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS "checklist_templates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workspace_id" uuid NOT NULL,
  "name" varchar(100) NOT NULL,
  "is_default" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "checklist_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "template_id" uuid NOT NULL,
  "label" varchar(200) NOT NULL,
  "required" boolean DEFAULT true NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS "checklist_responses" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "position_id" uuid NOT NULL,
  "item_id" uuid NOT NULL,
  "checked" boolean DEFAULT false NOT NULL,
  "submitted_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "mistakes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workspace_id" uuid NOT NULL,
  "label" varchar(100) NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "trade_reviews" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "position_id" uuid NOT NULL,
  "workspace_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "thesis_accuracy" integer,
  "entry_quality" integer,
  "exit_quality" integer,
  "position_sizing" integer,
  "lesson_learned" text,
  "reviewed_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "review_mistakes" (
  "review_id" uuid NOT NULL,
  "mistake_id" uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS "weekly_reviews" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workspace_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "week_key" varchar(10) NOT NULL,
  "week_start" timestamp NOT NULL,
  "week_pnl" numeric(10, 2),
  "trades_closed" integer DEFAULT 0 NOT NULL,
  "adherence_pct" integer,
  "what_went_well" text,
  "process_slips" text,
  "one_change" text,
  "completed_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "flow_signals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "ticker" varchar(10) NOT NULL,
  "structure" varchar(100) NOT NULL,
  "direction" varchar(20) NOT NULL,
  "premium_size" numeric(14, 2),
  "sweep_block" varchar(10),
  "confidence" numeric(5, 4),
  "volume" integer,
  "open_interest" integer,
  "metadata" jsonb,
  "signal_ts" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "flow_filters" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workspace_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "name" varchar(100) NOT NULL,
  "criteria" jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "ai_artifacts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workspace_id" uuid NOT NULL,
  "subject_type" varchar(50) NOT NULL,
  "subject_id" uuid NOT NULL,
  "kind" varchar(50) NOT NULL,
  "content" text NOT NULL,
  "tokens_used" integer,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "import_batches" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workspace_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "broker" varchar(50) NOT NULL,
  "row_count" integer DEFAULT 0 NOT NULL,
  "matched_count" integer DEFAULT 0 NOT NULL,
  "error_count" integer DEFAULT 0 NOT NULL,
  "status" "import_status" DEFAULT 'pending' NOT NULL,
  "preview_data" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "committed_at" timestamp
);

-- ─── Column patches ───────────────────────────────────────────────────────────
-- Every non-PK column for every table, in case CREATE TABLE IF NOT EXISTS
-- skipped a table that exists from a prior partial run without all columns.
-- ADD COLUMN IF NOT EXISTS is a no-op when the column already exists.

-- workspaces
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "name" varchar(100);
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "plan" text;
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "stripe_customer_id" text;
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "stripe_subscription_id" text;
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "stripe_current_period_end" timestamp;
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "created_at" timestamp;
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "updated_at" timestamp;

-- workspace_members
ALTER TABLE "workspace_members" ADD COLUMN IF NOT EXISTS "workspace_id" uuid;
ALTER TABLE "workspace_members" ADD COLUMN IF NOT EXISTS "user_id" uuid;
ALTER TABLE "workspace_members" ADD COLUMN IF NOT EXISTS "role" text;
ALTER TABLE "workspace_members" ADD COLUMN IF NOT EXISTS "joined_at" timestamp;

-- broker_accounts
ALTER TABLE "broker_accounts" ADD COLUMN IF NOT EXISTS "workspace_id" uuid;
ALTER TABLE "broker_accounts" ADD COLUMN IF NOT EXISTS "user_id" uuid;
ALTER TABLE "broker_accounts" ADD COLUMN IF NOT EXISTS "broker" varchar(50);
ALTER TABLE "broker_accounts" ADD COLUMN IF NOT EXISTS "label" varchar(100);
ALTER TABLE "broker_accounts" ADD COLUMN IF NOT EXISTS "created_at" timestamp;

-- positions
ALTER TABLE "positions" ADD COLUMN IF NOT EXISTS "workspace_id" uuid;
ALTER TABLE "positions" ADD COLUMN IF NOT EXISTS "user_id" uuid;
ALTER TABLE "positions" ADD COLUMN IF NOT EXISTS "broker_account_id" uuid;
ALTER TABLE "positions" ADD COLUMN IF NOT EXISTS "symbol" varchar(10);
ALTER TABLE "positions" ADD COLUMN IF NOT EXISTS "strategy_name" varchar(100);
ALTER TABLE "positions" ADD COLUMN IF NOT EXISTS "status" text;
ALTER TABLE "positions" ADD COLUMN IF NOT EXISTS "entry_thesis" text;
ALTER TABLE "positions" ADD COLUMN IF NOT EXISTS "checklist_score" integer;
ALTER TABLE "positions" ADD COLUMN IF NOT EXISTS "entry_credit" numeric(10, 4);
ALTER TABLE "positions" ADD COLUMN IF NOT EXISTS "realized_pnl" numeric(10, 2);
ALTER TABLE "positions" ADD COLUMN IF NOT EXISTS "return_on_risk" numeric(8, 4);
ALTER TABLE "positions" ADD COLUMN IF NOT EXISTS "opened_at" timestamp;
ALTER TABLE "positions" ADD COLUMN IF NOT EXISTS "closed_at" timestamp;
ALTER TABLE "positions" ADD COLUMN IF NOT EXISTS "created_at" timestamp;
ALTER TABLE "positions" ADD COLUMN IF NOT EXISTS "updated_at" timestamp;

-- position_legs
ALTER TABLE "position_legs" ADD COLUMN IF NOT EXISTS "position_id" uuid;
ALTER TABLE "position_legs" ADD COLUMN IF NOT EXISTS "type" text;
ALTER TABLE "position_legs" ADD COLUMN IF NOT EXISTS "side" text;
ALTER TABLE "position_legs" ADD COLUMN IF NOT EXISTS "strike" numeric(10, 2);
ALTER TABLE "position_legs" ADD COLUMN IF NOT EXISTS "expiration" timestamp;
ALTER TABLE "position_legs" ADD COLUMN IF NOT EXISTS "qty" integer;
ALTER TABLE "position_legs" ADD COLUMN IF NOT EXISTS "open_price" numeric(10, 4);
ALTER TABLE "position_legs" ADD COLUMN IF NOT EXISTS "close_price" numeric(10, 4);
ALTER TABLE "position_legs" ADD COLUMN IF NOT EXISTS "closed_at" timestamp;
ALTER TABLE "position_legs" ADD COLUMN IF NOT EXISTS "created_at" timestamp;

-- position_adjustments
ALTER TABLE "position_adjustments" ADD COLUMN IF NOT EXISTS "position_id" uuid;
ALTER TABLE "position_adjustments" ADD COLUMN IF NOT EXISTS "kind" text;
ALTER TABLE "position_adjustments" ADD COLUMN IF NOT EXISTS "premium_impact" numeric(10, 4);
ALTER TABLE "position_adjustments" ADD COLUMN IF NOT EXISTS "note" text;
ALTER TABLE "position_adjustments" ADD COLUMN IF NOT EXISTS "created_at" timestamp;

-- tags
ALTER TABLE "tags" ADD COLUMN IF NOT EXISTS "workspace_id" uuid;
ALTER TABLE "tags" ADD COLUMN IF NOT EXISTS "name" varchar(50);
ALTER TABLE "tags" ADD COLUMN IF NOT EXISTS "created_at" timestamp;

-- position_tags
ALTER TABLE "position_tags" ADD COLUMN IF NOT EXISTS "position_id" uuid;
ALTER TABLE "position_tags" ADD COLUMN IF NOT EXISTS "tag_id" uuid;

-- checklist_templates
ALTER TABLE "checklist_templates" ADD COLUMN IF NOT EXISTS "workspace_id" uuid;
ALTER TABLE "checklist_templates" ADD COLUMN IF NOT EXISTS "name" varchar(100);
ALTER TABLE "checklist_templates" ADD COLUMN IF NOT EXISTS "is_default" boolean;
ALTER TABLE "checklist_templates" ADD COLUMN IF NOT EXISTS "created_at" timestamp;
ALTER TABLE "checklist_templates" ADD COLUMN IF NOT EXISTS "updated_at" timestamp;

-- checklist_items
ALTER TABLE "checklist_items" ADD COLUMN IF NOT EXISTS "template_id" uuid;
ALTER TABLE "checklist_items" ADD COLUMN IF NOT EXISTS "label" varchar(200);
ALTER TABLE "checklist_items" ADD COLUMN IF NOT EXISTS "required" boolean;
ALTER TABLE "checklist_items" ADD COLUMN IF NOT EXISTS "sort_order" integer;

-- checklist_responses
ALTER TABLE "checklist_responses" ADD COLUMN IF NOT EXISTS "position_id" uuid;
ALTER TABLE "checklist_responses" ADD COLUMN IF NOT EXISTS "item_id" uuid;
ALTER TABLE "checklist_responses" ADD COLUMN IF NOT EXISTS "checked" boolean;
ALTER TABLE "checklist_responses" ADD COLUMN IF NOT EXISTS "submitted_at" timestamp;

-- mistakes
ALTER TABLE "mistakes" ADD COLUMN IF NOT EXISTS "workspace_id" uuid;
ALTER TABLE "mistakes" ADD COLUMN IF NOT EXISTS "label" varchar(100);
ALTER TABLE "mistakes" ADD COLUMN IF NOT EXISTS "created_at" timestamp;

-- trade_reviews
ALTER TABLE "trade_reviews" ADD COLUMN IF NOT EXISTS "position_id" uuid;
ALTER TABLE "trade_reviews" ADD COLUMN IF NOT EXISTS "workspace_id" uuid;
ALTER TABLE "trade_reviews" ADD COLUMN IF NOT EXISTS "user_id" uuid;
ALTER TABLE "trade_reviews" ADD COLUMN IF NOT EXISTS "thesis_accuracy" integer;
ALTER TABLE "trade_reviews" ADD COLUMN IF NOT EXISTS "entry_quality" integer;
ALTER TABLE "trade_reviews" ADD COLUMN IF NOT EXISTS "exit_quality" integer;
ALTER TABLE "trade_reviews" ADD COLUMN IF NOT EXISTS "position_sizing" integer;
ALTER TABLE "trade_reviews" ADD COLUMN IF NOT EXISTS "lesson_learned" text;
ALTER TABLE "trade_reviews" ADD COLUMN IF NOT EXISTS "reviewed_at" timestamp;
ALTER TABLE "trade_reviews" ADD COLUMN IF NOT EXISTS "updated_at" timestamp;

-- review_mistakes
ALTER TABLE "review_mistakes" ADD COLUMN IF NOT EXISTS "review_id" uuid;
ALTER TABLE "review_mistakes" ADD COLUMN IF NOT EXISTS "mistake_id" uuid;

-- weekly_reviews
ALTER TABLE "weekly_reviews" ADD COLUMN IF NOT EXISTS "workspace_id" uuid;
ALTER TABLE "weekly_reviews" ADD COLUMN IF NOT EXISTS "user_id" uuid;
ALTER TABLE "weekly_reviews" ADD COLUMN IF NOT EXISTS "week_key" varchar(10);
ALTER TABLE "weekly_reviews" ADD COLUMN IF NOT EXISTS "week_start" timestamp;
ALTER TABLE "weekly_reviews" ADD COLUMN IF NOT EXISTS "week_pnl" numeric(10, 2);
ALTER TABLE "weekly_reviews" ADD COLUMN IF NOT EXISTS "trades_closed" integer;
ALTER TABLE "weekly_reviews" ADD COLUMN IF NOT EXISTS "adherence_pct" integer;
ALTER TABLE "weekly_reviews" ADD COLUMN IF NOT EXISTS "what_went_well" text;
ALTER TABLE "weekly_reviews" ADD COLUMN IF NOT EXISTS "process_slips" text;
ALTER TABLE "weekly_reviews" ADD COLUMN IF NOT EXISTS "one_change" text;
ALTER TABLE "weekly_reviews" ADD COLUMN IF NOT EXISTS "completed_at" timestamp;

-- flow_signals
ALTER TABLE "flow_signals" ADD COLUMN IF NOT EXISTS "ticker" varchar(10);
ALTER TABLE "flow_signals" ADD COLUMN IF NOT EXISTS "structure" varchar(100);
ALTER TABLE "flow_signals" ADD COLUMN IF NOT EXISTS "direction" varchar(20);
ALTER TABLE "flow_signals" ADD COLUMN IF NOT EXISTS "premium_size" numeric(14, 2);
ALTER TABLE "flow_signals" ADD COLUMN IF NOT EXISTS "sweep_block" varchar(10);
ALTER TABLE "flow_signals" ADD COLUMN IF NOT EXISTS "confidence" numeric(5, 4);
ALTER TABLE "flow_signals" ADD COLUMN IF NOT EXISTS "volume" integer;
ALTER TABLE "flow_signals" ADD COLUMN IF NOT EXISTS "open_interest" integer;
ALTER TABLE "flow_signals" ADD COLUMN IF NOT EXISTS "metadata" jsonb;
ALTER TABLE "flow_signals" ADD COLUMN IF NOT EXISTS "signal_ts" timestamp;
ALTER TABLE "flow_signals" ADD COLUMN IF NOT EXISTS "created_at" timestamp;

-- flow_filters
ALTER TABLE "flow_filters" ADD COLUMN IF NOT EXISTS "workspace_id" uuid;
ALTER TABLE "flow_filters" ADD COLUMN IF NOT EXISTS "user_id" uuid;
ALTER TABLE "flow_filters" ADD COLUMN IF NOT EXISTS "name" varchar(100);
ALTER TABLE "flow_filters" ADD COLUMN IF NOT EXISTS "criteria" jsonb;
ALTER TABLE "flow_filters" ADD COLUMN IF NOT EXISTS "created_at" timestamp;

-- ai_artifacts
ALTER TABLE "ai_artifacts" ADD COLUMN IF NOT EXISTS "workspace_id" uuid;
ALTER TABLE "ai_artifacts" ADD COLUMN IF NOT EXISTS "subject_type" varchar(50);
ALTER TABLE "ai_artifacts" ADD COLUMN IF NOT EXISTS "subject_id" uuid;
ALTER TABLE "ai_artifacts" ADD COLUMN IF NOT EXISTS "kind" varchar(50);
ALTER TABLE "ai_artifacts" ADD COLUMN IF NOT EXISTS "content" text;
ALTER TABLE "ai_artifacts" ADD COLUMN IF NOT EXISTS "tokens_used" integer;
ALTER TABLE "ai_artifacts" ADD COLUMN IF NOT EXISTS "created_at" timestamp;

-- import_batches
ALTER TABLE "import_batches" ADD COLUMN IF NOT EXISTS "workspace_id" uuid;
ALTER TABLE "import_batches" ADD COLUMN IF NOT EXISTS "user_id" uuid;
ALTER TABLE "import_batches" ADD COLUMN IF NOT EXISTS "broker" varchar(50);
ALTER TABLE "import_batches" ADD COLUMN IF NOT EXISTS "row_count" integer;
ALTER TABLE "import_batches" ADD COLUMN IF NOT EXISTS "matched_count" integer;
ALTER TABLE "import_batches" ADD COLUMN IF NOT EXISTS "error_count" integer;
ALTER TABLE "import_batches" ADD COLUMN IF NOT EXISTS "status" text;
ALTER TABLE "import_batches" ADD COLUMN IF NOT EXISTS "preview_data" jsonb;
ALTER TABLE "import_batches" ADD COLUMN IF NOT EXISTS "created_at" timestamp;
ALTER TABLE "import_batches" ADD COLUMN IF NOT EXISTS "committed_at" timestamp;

-- ─── Foreign Keys ─────────────────────────────────────────────────────────────
-- WHEN OTHERS catches both duplicate_object (42710) and undefined_column (42703)
-- so partial DB state from any prior run can never block this script.

DO $$ BEGIN ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "broker_accounts" ADD CONSTRAINT "broker_accounts_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "positions" ADD CONSTRAINT "positions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "positions" ADD CONSTRAINT "positions_broker_account_id_broker_accounts_id_fk" FOREIGN KEY ("broker_account_id") REFERENCES "broker_accounts"("id") ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "position_legs" ADD CONSTRAINT "position_legs_position_id_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "positions"("id") ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "position_adjustments" ADD CONSTRAINT "position_adjustments_position_id_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "positions"("id") ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "tags" ADD CONSTRAINT "tags_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "position_tags" ADD CONSTRAINT "position_tags_position_id_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "positions"("id") ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "position_tags" ADD CONSTRAINT "position_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "checklist_templates" ADD CONSTRAINT "checklist_templates_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_template_id_checklist_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "checklist_templates"("id") ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "checklist_responses" ADD CONSTRAINT "checklist_responses_position_id_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "positions"("id") ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "checklist_responses" ADD CONSTRAINT "checklist_responses_item_id_checklist_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "checklist_items"("id") ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "mistakes" ADD CONSTRAINT "mistakes_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "trade_reviews" ADD CONSTRAINT "trade_reviews_position_id_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "positions"("id") ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "trade_reviews" ADD CONSTRAINT "trade_reviews_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "review_mistakes" ADD CONSTRAINT "review_mistakes_review_id_trade_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "trade_reviews"("id") ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "review_mistakes" ADD CONSTRAINT "review_mistakes_mistake_id_mistakes_id_fk" FOREIGN KEY ("mistake_id") REFERENCES "mistakes"("id") ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "weekly_reviews" ADD CONSTRAINT "weekly_reviews_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "flow_filters" ADD CONSTRAINT "flow_filters_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "ai_artifacts" ADD CONSTRAINT "ai_artifacts_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ─── Verify FK coverage after run (optional — paste in a separate query) ──────
-- SELECT tc.table_name, tc.constraint_name
-- FROM information_schema.table_constraints tc
-- WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.constraint_schema = 'public'
-- ORDER BY 1;

-- ─── Indexes ──────────────────────────────────────────────────────────────────
-- All wrapped in DO/WHEN OTHERS so a missing column from partial state
-- can never stop the script.

DO $$ BEGIN CREATE INDEX "ai_artifacts_workspace_idx" ON "ai_artifacts" ("workspace_id"); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN CREATE INDEX "ai_artifacts_subject_idx" ON "ai_artifacts" ("subject_type", "subject_id"); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN CREATE INDEX "broker_accounts_workspace_idx" ON "broker_accounts" ("workspace_id"); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN CREATE INDEX "checklist_items_template_idx" ON "checklist_items" ("template_id"); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN CREATE UNIQUE INDEX "unique_checklist_response" ON "checklist_responses" ("position_id", "item_id"); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN CREATE INDEX "checklist_templates_workspace_idx" ON "checklist_templates" ("workspace_id"); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN CREATE INDEX "flow_filters_workspace_idx" ON "flow_filters" ("workspace_id"); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN CREATE INDEX "flow_signals_ticker_idx" ON "flow_signals" ("ticker"); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN CREATE INDEX "flow_signals_ts_idx" ON "flow_signals" ("signal_ts"); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN CREATE INDEX "import_batches_workspace_idx" ON "import_batches" ("workspace_id"); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN CREATE UNIQUE INDEX "unique_mistake" ON "mistakes" ("workspace_id", "label"); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN CREATE INDEX "position_adjustments_position_idx" ON "position_adjustments" ("position_id"); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN CREATE INDEX "position_legs_position_idx" ON "position_legs" ("position_id"); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN CREATE UNIQUE INDEX "position_tags_pk" ON "position_tags" ("position_id", "tag_id"); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN CREATE INDEX "positions_workspace_idx" ON "positions" ("workspace_id"); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN CREATE INDEX "positions_user_idx" ON "positions" ("user_id"); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN CREATE INDEX "positions_status_idx" ON "positions" ("status"); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN CREATE INDEX "positions_symbol_idx" ON "positions" ("symbol"); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN CREATE UNIQUE INDEX "review_mistakes_pk" ON "review_mistakes" ("review_id", "mistake_id"); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN CREATE UNIQUE INDEX "unique_tag" ON "tags" ("workspace_id", "name"); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN CREATE INDEX "trade_reviews_position_idx" ON "trade_reviews" ("position_id"); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN CREATE INDEX "trade_reviews_workspace_idx" ON "trade_reviews" ("workspace_id"); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN CREATE UNIQUE INDEX "unique_weekly_review" ON "weekly_reviews" ("user_id", "week_key"); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN CREATE INDEX "weekly_reviews_workspace_idx" ON "weekly_reviews" ("workspace_id"); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN CREATE UNIQUE INDEX "unique_workspace_member" ON "workspace_members" ("workspace_id", "user_id"); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN CREATE INDEX "workspace_members_workspace_idx" ON "workspace_members" ("workspace_id"); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN CREATE INDEX "workspace_members_user_idx" ON "workspace_members" ("user_id"); EXCEPTION WHEN OTHERS THEN NULL; END $$;
