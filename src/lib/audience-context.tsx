"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";

export type AudienceMode = "adults" | "kids";

type AudienceContextValue = {
  audienceMode: AudienceMode;
  switchAudience: (mode: AudienceMode) => void;
};

const AudienceContext = createContext<AudienceContextValue>({
  audienceMode: "adults",
  switchAudience: () => {},
});

const STORAGE_KEY = "sg_audience";

function readSavedAudience(): AudienceMode {
  if (typeof window === "undefined") return "adults";
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === "kids" ? "kids" : "adults";
}

export function AudienceProvider({ children }: { children: ReactNode }) {
  const [audienceMode, setAudienceMode] = useState<AudienceMode>(readSavedAudience);

  const switchAudience = useCallback((mode: AudienceMode) => {
    setAudienceMode(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  }, []);

  return (
    <AudienceContext.Provider value={{ audienceMode, switchAudience }}>
      {children}
    </AudienceContext.Provider>
  );
}

export function useAudience() {
  return useContext(AudienceContext);
}
