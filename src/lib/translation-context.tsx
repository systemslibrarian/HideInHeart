"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";

import type { TranslationKey } from "@/types/domain";

type TranslationContextValue = {
  translationKey: TranslationKey;
  switchTranslation: (key: TranslationKey) => void;
};

const TranslationContext = createContext<TranslationContextValue>({
  translationKey: "niv",
  switchTranslation: () => {},
});

const STORAGE_KEY = "sg_translation";

const VALID_KEYS = new Set<TranslationKey>(["niv", "kjv", "nkjv", "esv"]);

function readSavedTranslation(): TranslationKey {
  if (typeof window === "undefined") return "niv";
  const saved = localStorage.getItem(STORAGE_KEY);
  return VALID_KEYS.has(saved as TranslationKey) ? (saved as TranslationKey) : "niv";
}

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [translationKey, setTranslationKey] = useState<TranslationKey>(readSavedTranslation);

  const switchTranslation = useCallback((key: TranslationKey) => {
    setTranslationKey(key);
    localStorage.setItem(STORAGE_KEY, key);

    /* Best-effort save for logged-in users */
    fetch("/api/profile/translation", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ translation: key }),
    }).catch(() => {
      /* offline or guest — ignore */
    });
  }, []);

  return (
    <TranslationContext.Provider value={{ translationKey, switchTranslation }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  return useContext(TranslationContext);
}
