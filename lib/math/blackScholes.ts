"use client";

/**
 * Pure Black-Scholes option pricing and Greeks.
 * All functions are deterministic and run client-side for instant builder feedback.
 */

// Standard normal CDF using Horner's approximation
export function ncdf(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - p : p;
}

// Standard normal PDF
export function npdf(x: number): number {
  return Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);
}

export function bsCall(S: number, K: number, t: number, v: number, r = 0.04): number {
  if (t <= 0) return Math.max(S - K, 0);
  const sq = v * Math.sqrt(t);
  const d1 = (Math.log(S / K) + (r + v * v / 2) * t) / sq;
  const d2 = d1 - sq;
  return S * ncdf(d1) - K * Math.exp(-r * t) * ncdf(d2);
}

export function bsPut(S: number, K: number, t: number, v: number, r = 0.04): number {
  if (t <= 0) return Math.max(K - S, 0);
  const sq = v * Math.sqrt(t);
  const d1 = (Math.log(S / K) + (r + v * v / 2) * t) / sq;
  const d2 = d1 - sq;
  return K * Math.exp(-r * t) * ncdf(-d2) - S * ncdf(-d1);
}

export type LegGreeks = {
  price: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
};

export type Leg = {
  type: "call" | "put";
  side: "long" | "short";
  strike: number;
  qty: number;
  excluded?: boolean;
};

export function optionValue(leg: Leg, S: number, t: number, v: number, r = 0.04): number {
  return leg.type === "call" ? bsCall(S, leg.strike, t, v, r) : bsPut(S, leg.strike, t, v, r);
}

export function legGreeks(leg: Leg, S: number, t: number, v: number, r = 0.04): LegGreeks {
  const K = leg.strike;
  const sq = Math.sqrt(t);
  const d1 = t > 0 ? (Math.log(S / K) + (r + v * v / 2) * t) / (v * sq) : 0;
  const d2 = d1 - v * sq;
  const nd1 = npdf(d1);
  const isCall = leg.type === "call";
  const price = optionValue(leg, S, t, v, r);
  const delta = isCall ? ncdf(d1) : ncdf(d1) - 1;
  const gamma = t > 0 ? nd1 / (S * v * sq) : 0;
  const vega = t > 0 ? (S * nd1 * sq) / 100 : 0;
  const theta = t > 0
    ? isCall
      ? (-(S * nd1 * v) / (2 * sq) - r * K * Math.exp(-r * t) * ncdf(d2)) / 365
      : (-(S * nd1 * v) / (2 * sq) + r * K * Math.exp(-r * t) * ncdf(-d2)) / 365
    : 0;
  const rho = t > 0
    ? isCall
      ? (K * t * Math.exp(-r * t) * ncdf(d2)) / 100
      : (-K * t * Math.exp(-r * t) * ncdf(-d2)) / 100
    : 0;
  const sign = (leg.side === "short" ? -1 : 1) * leg.qty;
  return {
    price,
    delta: delta * sign,
    gamma: gamma * sign,
    theta: theta * sign,
    vega: vega * sign,
    rho: rho * sign,
  };
}

export type StrategyStats = {
  maxProfit: number;
  maxLoss: number;
  breakevens: number[];
  probabilityOfProfit: number;
  netCredit: number;
};

/**
 * Calculates P&L at expiry for a given underlying price.
 * Returns per-contract dollar value (×100 already applied).
 */
export function expiryPnl(legs: Leg[], P: number, spot: number, iv: number, dte: number): number {
  let total = 0;
  for (const leg of legs) {
    if (leg.excluded) continue;
    const t0 = dte / 365;
    const entryPrice = optionValue(leg, spot, t0, iv);
    const exitPrice = optionValue(leg, P, 0, iv); // at expiry t=0
    const gain = leg.side === "long" ? exitPrice - entryPrice : entryPrice - exitPrice;
    total += gain * leg.qty;
  }
  return total * 100;
}

/**
 * P&L at a given price and elapsed days (for matrix).
 */
export function pnlAt(
  legs: Leg[],
  P: number,
  elapsedDays: number,
  spot: number,
  iv: number,
  dte: number
): number {
  const tRem = Math.max((dte - elapsedDays) / 365, 0);
  const t0 = dte / 365;
  let total = 0;
  for (const leg of legs) {
    if (leg.excluded) continue;
    const entryPrice = optionValue(leg, spot, t0, iv);
    const nowPrice = optionValue(leg, P, tRem, iv);
    const gain = leg.side === "long" ? nowPrice - entryPrice : entryPrice - nowPrice;
    total += gain * leg.qty;
  }
  return total * 100;
}

export function netCredit(legs: Leg[], spot: number, iv: number, dte: number): number {
  const t0 = dte / 365;
  let c = 0;
  for (const leg of legs) {
    if (leg.excluded) continue;
    c += (leg.side === "short" ? 1 : -1) * optionValue(leg, spot, t0, iv) * leg.qty;
  }
  return c * 100;
}

export function strategyStats(
  legs: Leg[],
  spot: number,
  iv: number,
  dte: number
): StrategyStats {
  const strikes = legs.filter((l) => !l.excluded).map((l) => l.strike);
  const lo = Math.min(...strikes) - 15;
  const hi = Math.max(...strikes) + 15;

  let maxProfit = -Infinity;
  let maxLoss = Infinity;
  let prev: { p: number; v: number } | null = null;
  const breakevens: number[] = [];

  for (let P = lo; P <= hi; P += 0.1) {
    const v = expiryPnl(legs, P, spot, iv, dte);
    if (v > maxProfit) maxProfit = v;
    if (v < maxLoss) maxLoss = v;
    if (prev !== null) {
      if ((prev.v < 0 && v >= 0) || (prev.v > 0 && v <= 0)) {
        breakevens.push(prev.p + (0 - prev.v) * (P - prev.p) / (v - prev.v));
      }
    }
    prev = { p: P, v };
  }
  breakevens.sort((a, b) => a - b);

  const sigmaT = spot * iv * Math.sqrt(dte / 365);
  let pop = 0;
  const pts = [-Infinity, ...breakevens, Infinity];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const mid = isFinite(a) && isFinite(b)
      ? (a + b) / 2
      : isFinite(a) ? a + 1 : isFinite(b) ? b - 1 : spot;
    if (expiryPnl(legs, mid, spot, iv, dte) > 0) {
      const loP = isFinite(a) ? ncdf((a - spot) / sigmaT) : 0;
      const hiP = isFinite(b) ? ncdf((b - spot) / sigmaT) : 1;
      pop += hiP - loP;
    }
  }

  return {
    maxProfit,
    maxLoss,
    breakevens,
    probabilityOfProfit: pop * 100,
    netCredit: netCredit(legs, spot, iv, dte),
  };
}
