"use client";

import { createContext, useContext, useReducer, ReactNode } from "react";
import type { BuilderLeg } from "@/types";

type BuilderState = {
  symbol: string;
  spot: number;
  ivPct: number;
  dte: number;
  legs: BuilderLeg[];
  rangePct: number;
  view: "table" | "graph";
  mode: "usd" | "pct";
};

type Action =
  | { type: "SET_SYMBOL"; symbol: string; spot: number }
  | { type: "SET_IV"; ivPct: number }
  | { type: "SET_DTE"; dte: number }
  | { type: "SET_RANGE"; rangePct: number }
  | { type: "SET_VIEW"; view: "table" | "graph" }
  | { type: "SET_MODE"; mode: "usd" | "pct" }
  | { type: "SET_LEGS"; legs: BuilderLeg[] }
  | { type: "UPDATE_LEG"; index: number; leg: Partial<BuilderLeg> }
  | { type: "ADD_LEG"; leg: BuilderLeg }
  | { type: "REMOVE_LEG"; index: number }
  | { type: "SET_STRIKE"; index: number; strike: number };

const initialState: BuilderState = {
  symbol: "SOFI",
  spot: 106.96,
  ivPct: 90,
  dte: 2.5,
  legs: [
    { type: "put", side: "short", strike: 107, qty: 1 },
    { type: "put", side: "long", strike: 102, qty: 1 },
  ],
  rangePct: 7.3,
  view: "table",
  mode: "usd",
};

function reducer(state: BuilderState, action: Action): BuilderState {
  switch (action.type) {
    case "SET_SYMBOL":
      return { ...state, symbol: action.symbol, spot: action.spot };
    case "SET_IV":
      return { ...state, ivPct: action.ivPct };
    case "SET_DTE":
      return { ...state, dte: action.dte };
    case "SET_RANGE":
      return { ...state, rangePct: action.rangePct };
    case "SET_VIEW":
      return { ...state, view: action.view };
    case "SET_MODE":
      return { ...state, mode: action.mode };
    case "SET_LEGS":
      return { ...state, legs: action.legs };
    case "UPDATE_LEG": {
      const legs = state.legs.map((l, i) =>
        i === action.index ? { ...l, ...action.leg } : l
      );
      return { ...state, legs };
    }
    case "ADD_LEG":
      return { ...state, legs: [...state.legs, action.leg] };
    case "REMOVE_LEG":
      return { ...state, legs: state.legs.filter((_, i) => i !== action.index) };
    case "SET_STRIKE": {
      const legs = state.legs.map((l, i) =>
        i === action.index ? { ...l, strike: action.strike } : l
      );
      return { ...state, legs };
    }
    default:
      return state;
  }
}

const Ctx = createContext<{
  state: BuilderState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function BuilderProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
}

export function useBuilder() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBuilder must be inside BuilderProvider");
  return ctx;
}
