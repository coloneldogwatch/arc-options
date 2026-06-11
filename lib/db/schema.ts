import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  numeric,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const planEnum = pgEnum("plan", ["free", "pro"]);
export const memberRoleEnum = pgEnum("member_role", ["owner", "admin", "member"]);
export const positionStatusEnum = pgEnum("position_status", ["open", "closed"]);
export const legTypeEnum = pgEnum("leg_type", ["call", "put"]);
export const legSideEnum = pgEnum("leg_side", ["long", "short"]);
export const adjustmentKindEnum = pgEnum("adjustment_kind", [
  "roll",
  "partial_close",
  "leg_add",
  "strike_change",
  "expiry_change",
]);
export const importStatusEnum = pgEnum("import_status", ["pending", "committed", "failed"]);

// ─── Workspaces ───────────────────────────────────────────────────────────────

export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull(),
  plan: planEnum("plan").notNull().default("free"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripeCurrentPeriodEnd: timestamp("stripe_current_period_end"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Workspace Members ────────────────────────────────────────────────────────

export const workspaceMembers = pgTable(
  "workspace_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(), // references auth.users
    role: memberRoleEnum("role").notNull().default("member"),
    joinedAt: timestamp("joined_at").notNull().defaultNow(),
  },
  (t) => ({
    uniqueMember: uniqueIndex("unique_workspace_member").on(t.workspaceId, t.userId),
    workspaceIdx: index("workspace_members_workspace_idx").on(t.workspaceId),
    userIdx: index("workspace_members_user_idx").on(t.userId),
  })
);

// ─── Broker Accounts ──────────────────────────────────────────────────────────

export const brokerAccounts = pgTable(
  "broker_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    broker: varchar("broker", { length: 50 }).notNull(), // e.g. "thinkorswim", "tastytrade", "robinhood"
    label: varchar("label", { length: 100 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    workspaceIdx: index("broker_accounts_workspace_idx").on(t.workspaceId),
  })
);

// ─── Positions (strategy-level, never raw legs) ───────────────────────────────

export const positions = pgTable(
  "positions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    brokerAccountId: uuid("broker_account_id").references(() => brokerAccounts.id),
    symbol: varchar("symbol", { length: 10 }).notNull(),
    strategyName: varchar("strategy_name", { length: 100 }).notNull(),
    status: positionStatusEnum("status").notNull().default("open"),
    entryThesis: text("entry_thesis"),
    checklistScore: integer("checklist_score"),
    entryCredit: numeric("entry_credit", { precision: 10, scale: 4 }),
    realizedPnl: numeric("realized_pnl", { precision: 10, scale: 2 }),
    returnOnRisk: numeric("return_on_risk", { precision: 8, scale: 4 }),
    openedAt: timestamp("opened_at").notNull().defaultNow(),
    closedAt: timestamp("closed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    workspaceIdx: index("positions_workspace_idx").on(t.workspaceId),
    userIdx: index("positions_user_idx").on(t.userId),
    statusIdx: index("positions_status_idx").on(t.status),
    symbolIdx: index("positions_symbol_idx").on(t.symbol),
  })
);

// ─── Position Legs ────────────────────────────────────────────────────────────
// Immutable once the position is closed. Adjustments go through position_adjustments.

export const positionLegs = pgTable(
  "position_legs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    positionId: uuid("position_id")
      .notNull()
      .references(() => positions.id, { onDelete: "cascade" }),
    type: legTypeEnum("type").notNull(),
    side: legSideEnum("side").notNull(),
    strike: numeric("strike", { precision: 10, scale: 2 }).notNull(),
    expiration: timestamp("expiration").notNull(),
    qty: integer("qty").notNull().default(1),
    openPrice: numeric("open_price", { precision: 10, scale: 4 }),
    closePrice: numeric("close_price", { precision: 10, scale: 4 }),
    closedAt: timestamp("closed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    positionIdx: index("position_legs_position_idx").on(t.positionId),
  })
);

// ─── Position Adjustments ─────────────────────────────────────────────────────

export const positionAdjustments = pgTable(
  "position_adjustments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    positionId: uuid("position_id")
      .notNull()
      .references(() => positions.id, { onDelete: "cascade" }),
    kind: adjustmentKindEnum("kind").notNull(),
    premiumImpact: numeric("premium_impact", { precision: 10, scale: 4 }),
    note: text("note"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    positionIdx: index("position_adjustments_position_idx").on(t.positionId),
  })
);

// ─── Tags ─────────────────────────────────────────────────────────────────────

export const tags = pgTable(
  "tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 50 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    uniqueTag: uniqueIndex("unique_tag").on(t.workspaceId, t.name),
  })
);

export const positionTags = pgTable(
  "position_tags",
  {
    positionId: uuid("position_id")
      .notNull()
      .references(() => positions.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: uniqueIndex("position_tags_pk").on(t.positionId, t.tagId),
  })
);

// ─── Checklist Templates & Items ──────────────────────────────────────────────

export const checklistTemplates = pgTable(
  "checklist_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    isDefault: boolean("is_default").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    workspaceIdx: index("checklist_templates_workspace_idx").on(t.workspaceId),
  })
);

export const checklistItems = pgTable(
  "checklist_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    templateId: uuid("template_id")
      .notNull()
      .references(() => checklistTemplates.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 200 }).notNull(),
    required: boolean("required").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => ({
    templateIdx: index("checklist_items_template_idx").on(t.templateId),
  })
);

export const checklistResponses = pgTable(
  "checklist_responses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    positionId: uuid("position_id")
      .notNull()
      .references(() => positions.id, { onDelete: "cascade" }),
    itemId: uuid("item_id")
      .notNull()
      .references(() => checklistItems.id, { onDelete: "cascade" }),
    checked: boolean("checked").notNull().default(false),
    submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  },
  (t) => ({
    uniqueResponse: uniqueIndex("unique_checklist_response").on(t.positionId, t.itemId),
  })
);

// ─── Mistakes ─────────────────────────────────────────────────────────────────

export const mistakes = pgTable(
  "mistakes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 100 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    uniqueMistake: uniqueIndex("unique_mistake").on(t.workspaceId, t.label),
  })
);

// ─── Trade Reviews ────────────────────────────────────────────────────────────

export const tradeReviews = pgTable(
  "trade_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    positionId: uuid("position_id")
      .notNull()
      .references(() => positions.id, { onDelete: "cascade" }),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    thesisAccuracy: integer("thesis_accuracy"),
    entryQuality: integer("entry_quality"),
    exitQuality: integer("exit_quality"),
    positionSizing: integer("position_sizing"),
    lessonLearned: text("lesson_learned"),
    reviewedAt: timestamp("reviewed_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    positionIdx: index("trade_reviews_position_idx").on(t.positionId),
    workspaceIdx: index("trade_reviews_workspace_idx").on(t.workspaceId),
  })
);

export const reviewMistakes = pgTable(
  "review_mistakes",
  {
    reviewId: uuid("review_id")
      .notNull()
      .references(() => tradeReviews.id, { onDelete: "cascade" }),
    mistakeId: uuid("mistake_id")
      .notNull()
      .references(() => mistakes.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: uniqueIndex("review_mistakes_pk").on(t.reviewId, t.mistakeId),
  })
);

// ─── Weekly Reviews ───────────────────────────────────────────────────────────

export const weeklyReviews = pgTable(
  "weekly_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    weekKey: varchar("week_key", { length: 10 }).notNull(), // "2024-W23"
    weekStart: timestamp("week_start").notNull(),
    weekPnl: numeric("week_pnl", { precision: 10, scale: 2 }),
    tradesClosed: integer("trades_closed").notNull().default(0),
    adherencePct: integer("adherence_pct"),
    whatWentWell: text("what_went_well"),
    processSlips: text("process_slips"),
    oneChange: text("one_change"),
    completedAt: timestamp("completed_at").notNull().defaultNow(),
  },
  (t) => ({
    uniqueWeek: uniqueIndex("unique_weekly_review").on(t.userId, t.weekKey),
    workspaceIdx: index("weekly_reviews_workspace_idx").on(t.workspaceId),
  })
);

// ─── Flow Signals (Pro) ───────────────────────────────────────────────────────

export const flowSignals = pgTable(
  "flow_signals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ticker: varchar("ticker", { length: 10 }).notNull(),
    structure: varchar("structure", { length: 100 }).notNull(),
    direction: varchar("direction", { length: 20 }).notNull(), // "bullish"|"bearish"|"neutral"
    premiumSize: numeric("premium_size", { precision: 14, scale: 2 }),
    sweepBlock: varchar("sweep_block", { length: 10 }), // "sweep"|"block"
    confidence: numeric("confidence", { precision: 5, scale: 4 }),
    volume: integer("volume"),
    openInterest: integer("open_interest"),
    metadata: jsonb("metadata"),
    signalTs: timestamp("signal_ts").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    tickerIdx: index("flow_signals_ticker_idx").on(t.ticker),
    tsIdx: index("flow_signals_ts_idx").on(t.signalTs),
  })
);

export const flowFilters = pgTable(
  "flow_filters",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    criteria: jsonb("criteria").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    workspaceIdx: index("flow_filters_workspace_idx").on(t.workspaceId),
  })
);

// ─── AI Artifacts ─────────────────────────────────────────────────────────────

export const aiArtifacts = pgTable(
  "ai_artifacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    subjectType: varchar("subject_type", { length: 50 }).notNull(), // "trade_recap"|"behavioral_analysis"
    subjectId: uuid("subject_id").notNull(),
    kind: varchar("kind", { length: 50 }).notNull(),
    content: text("content").notNull(),
    tokensUsed: integer("tokens_used"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    workspaceIdx: index("ai_artifacts_workspace_idx").on(t.workspaceId),
    subjectIdx: index("ai_artifacts_subject_idx").on(t.subjectType, t.subjectId),
  })
);

// ─── Import Batches ───────────────────────────────────────────────────────────

export const importBatches = pgTable(
  "import_batches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    broker: varchar("broker", { length: 50 }).notNull(),
    rowCount: integer("row_count").notNull().default(0),
    matchedCount: integer("matched_count").notNull().default(0),
    errorCount: integer("error_count").notNull().default(0),
    status: importStatusEnum("status").notNull().default("pending"),
    previewData: jsonb("preview_data"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    committedAt: timestamp("committed_at"),
  },
  (t) => ({
    workspaceIdx: index("import_batches_workspace_idx").on(t.workspaceId),
  })
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  members: many(workspaceMembers),
  positions: many(positions),
  weeklyReviews: many(weeklyReviews),
  checklistTemplates: many(checklistTemplates),
  tradeReviews: many(tradeReviews),
  brokerAccounts: many(brokerAccounts),
  tags: many(tags),
  mistakes: many(mistakes),
}));

export const positionsRelations = relations(positions, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [positions.workspaceId], references: [workspaces.id] }),
  brokerAccount: one(brokerAccounts, { fields: [positions.brokerAccountId], references: [brokerAccounts.id] }),
  legs: many(positionLegs),
  adjustments: many(positionAdjustments),
  checklistResponses: many(checklistResponses),
  tradeReview: many(tradeReviews),
  positionTags: many(positionTags),
}));

export const positionLegsRelations = relations(positionLegs, ({ one }) => ({
  position: one(positions, { fields: [positionLegs.positionId], references: [positions.id] }),
}));

export const tradeReviewsRelations = relations(tradeReviews, ({ one, many }) => ({
  position: one(positions, { fields: [tradeReviews.positionId], references: [positions.id] }),
  workspace: one(workspaces, { fields: [tradeReviews.workspaceId], references: [workspaces.id] }),
  reviewMistakes: many(reviewMistakes),
}));

export const checklistTemplatesRelations = relations(checklistTemplates, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [checklistTemplates.workspaceId], references: [workspaces.id] }),
  items: many(checklistItems),
}));

export const checklistItemsRelations = relations(checklistItems, ({ one, many }) => ({
  template: one(checklistTemplates, { fields: [checklistItems.templateId], references: [checklistTemplates.id] }),
  responses: many(checklistResponses),
}));
