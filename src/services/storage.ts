import { FavoriteItem, WatchProgress } from "@/types/iptv";

const FAVORITES_KEY = "fulltv_favorites_v1";
const PROGRESS_KEY = "fulltv_progress_v1";
const CREDENTIALS_KEY = "fulltv_credentials_v1";

export interface CustomCredentials {
  server: string;
  username: string;
  password: string;
}

export function getFavorites(): FavoriteItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to read favorites", e);
    return [];
  }
}

export function saveFavorite(item: FavoriteItem): FavoriteItem[] {
  if (typeof window === "undefined") return [];
  try {
    const current = getFavorites();
    const filtered = current.filter((fav) => fav.id !== item.id);
    const updated = [item, ...filtered];
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error("Failed to save favorite", e);
    return [];
  }
}

export function removeFavorite(id: string): FavoriteItem[] {
  if (typeof window === "undefined") return [];
  try {
    const current = getFavorites();
    const updated = current.filter((fav) => fav.id !== id);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error("Failed to remove favorite", e);
    return [];
  }
}

export function isFavorite(id: string): boolean {
  if (typeof window === "undefined") return false;
  const current = getFavorites();
  return current.some((fav) => fav.id === id);
}

export function getWatchHistory(): WatchProgress[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveWatchProgress(progress: WatchProgress): void {
  if (typeof window === "undefined") return;
  try {
    const history = getWatchHistory().filter((p) => p.id !== progress.id);
    // Keep last 30 watched items
    const updated = [progress, ...history].slice(0, 30);
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save watch progress", e);
  }
}

export function getStoredCredentials(): CustomCredentials | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CREDENTIALS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function saveStoredCredentials(creds: CustomCredentials): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(creds));
  } catch (e) {}
}

export function clearStoredCredentials(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CREDENTIALS_KEY);
  } catch (e) {}
}
