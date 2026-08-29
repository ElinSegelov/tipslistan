"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_COUNTRY } from "@/lib/countries";

const STORAGE_KEY = "marquee.country";
const listeners = new Set<() => void>();

function getSnapshot(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_COUNTRY;
  } catch {
    return DEFAULT_COUNTRY;
  }
}

function getServerSnapshot(): string {
  return DEFAULT_COUNTRY;
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function setStoredCountry(code: string) {
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // localStorage unavailable (private mode etc.) — the in-memory listeners
    // below still let the UI update for the rest of this session.
  }
  listeners.forEach((l) => l());
}

/** Persists the viewer's chosen streaming region across visits (client-only, no backend). */
export function useCountry(): [string, (code: string) => void] {
  const country = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return [country, setStoredCountry];
}
