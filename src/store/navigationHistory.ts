/**
 * Navigation history — tracks back/forward navigation stack.
 */

import { create } from "zustand";
import type { NavigationEntry } from "@/types";

interface NavigationState {
  history: NavigationEntry[];
  currentIndex: number;
  push: (entry: NavigationEntry) => void;
  back: () => NavigationEntry | null;
  forward: () => NavigationEntry | null;
  current: () => NavigationEntry | null;
  recentItems: (limit?: number) => NavigationEntry[];
}

const MAX_HISTORY = 100;

export const useNavigationHistory = create<NavigationState>((set, get) => ({
  history: [],
  currentIndex: -1,

  push: (entry) =>
    set((state) => {
      // Truncate forward history when navigating from middle of stack
      const truncated = state.history.slice(0, state.currentIndex + 1);
      const newHistory = [...truncated, entry].slice(-MAX_HISTORY);
      return {
        history: newHistory,
        currentIndex: newHistory.length - 1,
      };
    }),

  back: () => {
    const { history, currentIndex } = get();
    if (currentIndex <= 0) return null;
    set({ currentIndex: currentIndex - 1 });
    return history[currentIndex - 1] ?? null;
  },

  forward: () => {
    const { history, currentIndex } = get();
    if (currentIndex >= history.length - 1) return null;
    set({ currentIndex: currentIndex + 1 });
    return history[currentIndex + 1] ?? null;
  },

  current: () => {
    const { history, currentIndex } = get();
    return history[currentIndex] ?? null;
  },

  recentItems: (limit = 10) => {
    const { history } = get();
    const seen = new Set<string>();
    const unique: NavigationEntry[] = [];
    for (let i = history.length - 1; i >= 0 && unique.length < limit; i--) {
      const entry = history[i];
      if (entry && !seen.has(entry.path)) {
        seen.add(entry.path);
        unique.push(entry);
      }
    }
    return unique;
  },
}));
