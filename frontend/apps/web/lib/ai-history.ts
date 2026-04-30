import { apiFetch } from "./api-client";

const LOCAL_STORAGE_KEY = "ai-history-guest";

export type AIHistoryItem = {
  id?: string;
  prompt: string;
  results: any[];
  suggestedResults: any[];
  createdAt: string;
};

// ── Save history locally (Guest) or DB (Logged In) ─────────────────────────
export async function saveAiHistory(
  prompt: string,
  results: any[],
  suggestedResults: any[],
  session: any
) {
  const newItem: AIHistoryItem = {
    prompt,
    results,
    suggestedResults,
    createdAt: new Date().toISOString(),
  };

  if (session && session.user) {
    // Save directly to DB
    try {
      const res = await apiFetch("/api/ai/history", {
        method: "POST",
        body: JSON.stringify(newItem),
      });
      if (!res.ok) {
        const err = await res.text();
        console.error("DB save failed, falling back to localStorage:", err);
        // Fallback to localStorage so history is never lost
        _saveToLocal(newItem);
      }
    } catch (err) {
      console.error("Failed to save AI history to DB, falling back:", err);
      _saveToLocal(newItem);
    }
  } else {
    _saveToLocal(newItem);
  }
}

function _saveToLocal(item: AIHistoryItem) {
  try {
    const existingStr = localStorage.getItem(LOCAL_STORAGE_KEY);
    const existing: AIHistoryItem[] = existingStr ? JSON.parse(existingStr) : [];
    const updated = [item, ...existing].slice(0, 20);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to save AI history to localStorage:", err);
  }
}

// ── Get history ─────────────────────────────────────────────────────────────
export async function getAiHistory(session: any): Promise<AIHistoryItem[]> {
  if (session && session.user) {
    try {
      const res = await apiFetch("/api/ai/history");
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.error("Failed to fetch AI history from DB", err);
    }
    return [];
  } else {
    try {
      const existingStr = localStorage.getItem(LOCAL_STORAGE_KEY);
      return existingStr ? JSON.parse(existingStr) : [];
    } catch {
      return [];
    }
  }
}

// ── Sync local to DB upon login ─────────────────────────────────────────────
export async function syncHistoryOnLogin() {
  try {
    const existingStr = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!existingStr) return;

    const items: AIHistoryItem[] = JSON.parse(existingStr);
    if (items.length === 0) return;

    const res = await apiFetch("/api/ai/history", {
      method: "POST",
      body: JSON.stringify(items),
    });

    if (res.ok) {
      // Clear local storage after successful sync
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      console.log("Synced local AI history to database.");
    }
  } catch (err) {
    console.error("Failed to sync AI history", err);
  }
}
