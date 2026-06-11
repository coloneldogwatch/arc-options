export type Plan = "free" | "pro";
export type MemberRole = "owner" | "admin" | "member";
export type PositionStatus = "open" | "closed";
export type LegType = "call" | "put";
export type LegSide = "long" | "short";

// ─── Builder types ────────────────────────────────────────────────────────────

export type BuilderLeg = {
  type: LegType;
  side: LegSide;
  strike: number;
  qty: number;
  excluded?: boolean;
};

export type BuilderState = {
  symbol: string;
  spot: number;
  ivPct: number;
  dte: number;
  legs: BuilderLeg[];
  rangePct: number;
  view: "table" | "graph";
  mode: "usd" | "pct";
};

// ─── Strategy library ─────────────────────────────────────────────────────────

export type StrategyTier = "Novice" | "Intermediate" | "Advanced" | "Expert";
export type StrategyOutlook = "Bullish" | "Bearish" | "Neutral" | "Volatility" | "Income" | "Hedge";

export type StrategyEntry = {
  name: string;
  tier: StrategyTier;
  category: string;
  outlook: StrategyOutlook;
  templateKey: string;
};

// ─── Position / trade types ────────────────────────────────────────────────────

export type Position = {
  id: string;
  workspaceId: string;
  userId: string;
  symbol: string;
  strategyName: string;
  legsSnapshot: BuilderLeg[];
  status: PositionStatus;
  entryThesis?: string | null;
  checklistScore?: number | null;
  entryCredit?: string | null;
  realizedPnl?: string | null;
  openedAt: Date;
  closedAt?: Date | null;
};

export type TradeReview = {
  id: string;
  positionId: string;
  workspaceId: string;
  userId: string;
  thesisAccuracy?: number | null;
  entryQuality?: number | null;
  exitQuality?: number | null;
  positionSizing?: number | null;
  lesson?: string | null;
  mistakeTags: string[];
  reviewedAt: Date;
};

export type WeeklyReview = {
  id: string;
  workspaceId: string;
  userId: string;
  weekKey: string;
  weekPnl?: string | null;
  tradesClosed: number;
  adherencePct?: number | null;
  whatWentWell?: string | null;
  processSlips?: string | null;
  oneChange?: string | null;
  completedAt: Date;
};

// ─── Workspace context ────────────────────────────────────────────────────────

export type WorkspaceContext = {
  workspaceId: string;
  userId: string;
  plan: Plan;
  role: MemberRole;
};

// ─── Checklist ────────────────────────────────────────────────────────────────

export type ChecklistTemplate = {
  required: string[];
  optional: string[];
};

export const DEFAULT_CHECKLIST: ChecklistTemplate = {
  required: [
    "Defined max loss within risk limit",
    "Underlying is liquid (tight bid/ask)",
    "Entry thesis written",
    "Position size ≤ 5% of account",
    "Clear profit target & exit plan",
  ],
  optional: [
    "No earnings before expiration",
    "IV rank above 30",
    "Aligns with this week's bias",
  ],
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

export type DashboardMetrics = {
  netPnlMonth: number;
  winRate: number;
  openPositions: number;
  checklistAdherence: number;
};

export type OpenPositionRow = {
  id: string;
  symbol: string;
  strategyName: string;
  dte: number;
  openPnl: number;
  status: "on_track" | "watch" | "alert";
};

// ─── Analytics ────────────────────────────────────────────────────────────────

export type AnalyticsMetrics = {
  expectancyPerTrade: number;
  profitFactor: number;
  avgWinLossRatio: number;
  currentStreak: number;
  streakType: "W" | "L";
};

// ─── Optimizer (PRO) ─────────────────────────────────────────────────────────

export type OptimizerParams = {
  symbol: string;
  bias: "neutral" | "bullish" | "bearish";
  maxRisk: number;
  expiryWindow: "0-14" | "20-45";
  rankBy: "balanced" | "highest_return" | "highest_pop";
};

export type OptimizerResult = {
  strategyName: string;
  strikes: string;
  credit: number;
  maxProfit: number;
  maxLoss: number;
  breakevens: number[];
  pop: number;
  isBestFit: boolean;
};

// ─── Flow scanner (PRO) ───────────────────────────────────────────────────────

export type FlowSignal = "Bullish" | "Bearish" | "Neutral";

export type FlowEntry = {
  id: string;
  ticker: string;
  structure: string;
  premium: number;
  signal: FlowSignal;
  timestamp: Date;
};
