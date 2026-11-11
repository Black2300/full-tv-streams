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
