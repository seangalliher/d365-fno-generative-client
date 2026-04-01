import { describe, it, expect, beforeEach } from "vitest";
import { useNavigationHistory } from "./navigationHistory";

function entry(path: string, label = path) {
  return { path, label, timestamp: new Date().toISOString() };
}

describe("useNavigationHistory", () => {
  beforeEach(() => {
    useNavigationHistory.setState({ history: [], currentIndex: -1 });
  });

  it("starts with empty history", () => {
    const state = useNavigationHistory.getState();
    expect(state.history).toHaveLength(0);
    expect(state.currentIndex).toBe(-1);
  });

  it("push adds entries", () => {
    const { push } = useNavigationHistory.getState();
    push(entry("/a"));
    push(entry("/b"));
    const state = useNavigationHistory.getState();
    expect(state.history).toHaveLength(2);
    expect(state.currentIndex).toBe(1);
  });

  it("current returns latest pushed entry", () => {
    const { push } = useNavigationHistory.getState();
    push(entry("/a", "Page A"));
    expect(useNavigationHistory.getState().current()?.label).toBe("Page A");
    push(entry("/b", "Page B"));
    expect(useNavigationHistory.getState().current()?.label).toBe("Page B");
  });

  it("back navigates to previous entry", () => {
    const { push } = useNavigationHistory.getState();
    push(entry("/a", "A"));
    push(entry("/b", "B"));
    const result = useNavigationHistory.getState().back();
    expect(result?.label).toBe("A");
    expect(useNavigationHistory.getState().currentIndex).toBe(0);
  });

  it("back returns null at beginning", () => {
    const { push } = useNavigationHistory.getState();
    push(entry("/a"));
    expect(useNavigationHistory.getState().back()).toBeNull();
  });

  it("forward navigates after back", () => {
    const { push } = useNavigationHistory.getState();
    push(entry("/a", "A"));
    push(entry("/b", "B"));
    useNavigationHistory.getState().back();
    const result = useNavigationHistory.getState().forward();
    expect(result?.label).toBe("B");
  });

  it("forward returns null at end", () => {
    const { push } = useNavigationHistory.getState();
    push(entry("/a"));
    expect(useNavigationHistory.getState().forward()).toBeNull();
  });

  it("push after back truncates forward history", () => {
    const { push } = useNavigationHistory.getState();
    push(entry("/a"));
    push(entry("/b"));
    push(entry("/c"));
    useNavigationHistory.getState().back();
    useNavigationHistory.getState().back();
    useNavigationHistory.getState().push(entry("/d"));
    const state = useNavigationHistory.getState();
    expect(state.history).toHaveLength(2);
    expect(state.history.map((h) => h.path)).toEqual(["/a", "/d"]);
  });

  it("recentItems returns unique paths most-recent-first", () => {
    const { push } = useNavigationHistory.getState();
    push(entry("/a", "A"));
    push(entry("/b", "B"));
    push(entry("/a", "A2"));
    push(entry("/c", "C"));
    const recent = useNavigationHistory.getState().recentItems(10);
    expect(recent.map((r) => r.path)).toEqual(["/c", "/a", "/b"]);
  });

  it("recentItems respects limit", () => {
    const { push } = useNavigationHistory.getState();
    push(entry("/a"));
    push(entry("/b"));
    push(entry("/c"));
    const recent = useNavigationHistory.getState().recentItems(2);
    expect(recent).toHaveLength(2);
  });

  it("caps history at 100 entries", () => {
    const { push } = useNavigationHistory.getState();
    for (let i = 0; i < 120; i++) {
      push(entry(`/page-${i}`));
    }
    expect(useNavigationHistory.getState().history.length).toBeLessThanOrEqual(100);
  });
});
