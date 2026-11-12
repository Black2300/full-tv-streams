import {
  AuthResponse,
  Category,
  LiveStream,
  SeriesDetailResponse,
  SeriesItem,
  VodStream,
} from "@/types/iptv";
import { getStoredCredentials } from "./storage";

export const DEFAULT_CONFIG = {
  server: process.env.NEXT_PUBLIC_IPTV_SERVER || "https://fullagora.fun",
  username: process.env.NEXT_PUBLIC_IPTV_USERNAME || "kettericasa",
  password: process.env.NEXT_PUBLIC_IPTV_PASSWORD || "510272859",
};

export function getActiveCredentials() {
  const stored = getStoredCredentials();
  if (stored && stored.username && stored.password && stored.server) {
    return stored;
  }
  return DEFAULT_CONFIG;
}

function buildApiUrl(action?: string, params?: Record<string, string | number>) {
  const creds = getActiveCredentials();
  const search = new URLSearchParams();

  if (action) search.set("action", action);
  if (creds.server) search.set("server", creds.server);
  if (creds.username) search.set("username", creds.username);
  if (creds.password) search.set("password", creds.password);

  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        search.set(k, String(v));
      }
    });
  }

  return `/api/iptv?${search.toString()}`;
}

export async function fetchAuth(): Promise<AuthResponse> {
  const url = buildApiUrl();
  const res = await fetch(url);
  if (!res.ok) throw new Error("Falha ao autenticar no servidor IPTV");
  return res.json();
}

export async function fetchLiveCategories(): Promise<Category[]> {
  const url = buildApiUrl("get_live_categories");
  const res = await fetch(url);
  if (!res.ok) throw new Error("Falha ao buscar categorias de TV");
  return res.json();
}

export async function fetchVodCategories(): Promise<Category[]> {
  const url = buildApiUrl("get_vod_categories");
  const res = await fetch(url);
  if (!res.ok) throw new Error("Falha ao buscar categorias de filmes");
  return res.json();
}

export async function fetchSeriesCategories(): Promise<Category[]> {
  const url = buildApiUrl("get_series_categories");
  const res = await fetch(url);
  if (!res.ok) throw new Error("Falha ao buscar categorias de séries");
  return res.json();
}

export async function fetchLiveStreams(categoryId?: string): Promise<LiveStream[]> {
  const url = buildApiUrl("get_live_streams", categoryId ? { category_id: categoryId } : {});
  const res = await fetch(url);
  if (!res.ok) throw new Error("Falha ao buscar canais de TV");
  return res.json();
}

export async function fetchVodStreams(categoryId?: string): Promise<VodStream[]> {
  const url = buildApiUrl("get_vod_streams", categoryId ? { category_id: categoryId } : {});
  const res = await fetch(url);
  if (!res.ok) throw new Error("Falha ao buscar catálogo de filmes");
  return res.json();
}

export async function fetchSeries(categoryId?: string): Promise<SeriesItem[]> {
  const url = buildApiUrl("get_series", categoryId ? { category_id: categoryId } : {});
  const res = await fetch(url);
  if (!res.ok) throw new Error("Falha ao buscar catálogo de séries");
  return res.json();
}

export async function fetchSeriesInfo(seriesId: number | string): Promise<SeriesDetailResponse> {
  const url = buildApiUrl("get_series_info", { series_id: seriesId });
  const res = await fetch(url);
  if (!res.ok) throw new Error("Falha ao buscar detalhes da série");
  return res.json();
}

/**
 * Builds direct stream URLs for playback
 */
export function getLiveStreamUrl(streamId: number | string): string {
  const creds = getActiveCredentials();
  const base = creds.server.replace(/\/+$/, "");
  // Both https://fullagora.fun/live/{u}/{p}/{id}.m3u8 and http work
  return `${base}/live/${encodeURIComponent(creds.username)}/${encodeURIComponent(creds.password)}/${streamId}.m3u8`;
}

export function getMovieStreamUrl(streamId: number | string, extension: string = "mp4"): string {
  const creds = getActiveCredentials();
  const base = creds.server.replace(/\/+$/, "");
  const ext = extension || "mp4";
  return `${base}/movie/${encodeURIComponent(creds.username)}/${encodeURIComponent(creds.password)}/${streamId}.${ext}`;
}

export function getEpisodeStreamUrl(streamId: number | string, extension: string = "mp4"): string {
  const creds = getActiveCredentials();
  const base = creds.server.replace(/\/+$/, "");
  const ext = extension || "mp4";
  return `${base}/series/${encodeURIComponent(creds.username)}/${encodeURIComponent(creds.password)}/${streamId}.${ext}`;
}

/**
 * Normalizes HTTP image links to HTTPS to prevent mixed content blocking on Vercel
 */
export function formatImageUrl(url?: string): string {
  if (!url) return "";
  let clean = url.trim();
  if (clean.startsWith("http://")) {
    clean = "https://" + clean.substring(7);
  }
  return clean;
}

/**
 * Cleans prefix like "Filmes | " or "Series | " for UI readability
 */
export function cleanCategoryName(name: string): string {
  if (!name) return "";
  return name.replace(/^(Filmes|Series|Canais)\s*\|\s*/i, "").trim();
}

/**
 * Extrai de forma inteligente o ano de lançamento de um filme ou série
 * Prioriza item.year, item.release_date, item.releaseDate ou ano embutido no título/nome
 * Ex: "Deadpool & Wolverine (2024)", "Avatar 3 2025", "Superman (2025)"
 */
export function extractReleaseYear(item: {
  year?: string | number;
  release_date?: string;
  releaseDate?: string;
  title?: string;
  name?: string;
}): number {
  if (!item) return 0;

  if (item.year) {
    const y = parseInt(String(item.year).trim(), 10);
    if (!isNaN(y) && y >= 1920 && y <= 2035) return y;
  }
  if (item.release_date) {
    const match = String(item.release_date).match(/\b(19\d\d|20\d\d)\b/);
    if (match) {
      const y = parseInt(match[1], 10);
      if (y >= 1920 && y <= 2035) return y;
    }
  }
  if (item.releaseDate) {
    const match = String(item.releaseDate).match(/\b(19\d\d|20\d\d)\b/);
    if (match) {
      const y = parseInt(match[1], 10);
      if (y >= 1920 && y <= 2035) return y;
    }
  }

  const title = item.title || item.name || "";
  // Detecta ano entre parênteses, colchetes ou separado por hífen/espaço
  const match = title.match(/[\(\[\-\s](202\d|201\d|200\d|19\d\d)[\)\]\s]?/);
  if (match) {
    const y = parseInt(match[1], 10);
    if (y >= 1920 && y <= 2035) return y;
  }

  // Fallback geral para qualquer 4 dígitos coerentes
  const fallback = title.match(/\b(19\d\d|20\d\d)\b/);
  if (fallback) {
    const y = parseInt(fallback[1], 10);
    if (y >= 1920 && y <= 2035) return y;
  }

  return 0;
}

/**
 * Ordena filmes ou séries colocando os lançamentos mais recentes (2026, 2025, 2024...) sempre no topo
 */
export function sortMediaByRecent<T extends { stream_id?: number | string; series_id?: number | string }>(
  items: T[]
): T[] {
  return [...items].sort((a, b) => {
    const yearA = extractReleaseYear(a as any);
    const yearB = extractReleaseYear(b as any);

    if (yearB !== yearA) {
      return yearB - yearA; // Maior ano sempre primeiro (2026 > 2025 > ...)
    }

    const idA = Number(a.stream_id || a.series_id || 0);
    const idB = Number(b.stream_id || b.series_id || 0);
    return idB - idA;
  });
}

