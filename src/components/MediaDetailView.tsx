"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Play,
  Star,
  Plus,
  Check,
  Film,
  Tv,
  Clock,
  Calendar,
  Layers,
} from "lucide-react";
import {
  VodStream,
  SeriesItem,
  PlayableItem,
  SeriesDetailResponse,
  EpisodeInfo,
} from "@/types/iptv";
import {
  fetchSeriesInfo,
  formatImageUrl,
  getMovieStreamUrl,
  getEpisodeStreamUrl,
  extractReleaseYear,
} from "@/services/iptv";
import { isFavorite, removeFavorite, saveFavorite } from "@/services/storage";

interface MediaDetailViewProps {
  item: VodStream | SeriesItem | null;
  type: "movie" | "series";
  onBack: () => void;
  onPlay: (playable: PlayableItem) => void;
}

export const MediaDetailView: React.FC<MediaDetailViewProps> = ({
  item,
  type,
  onBack,
  onPlay,
}) => {
  const [seriesData, setSeriesData] = useState<SeriesDetailResponse | null>(null);
  const [activeSeason, setActiveSeason] = useState<string>("1");
  const [loadingSeries, setLoadingSeries] = useState(false);
  const [favorite, setFavorite] = useState(false);

  const isSeries = type === "series";
  const id = item ? (isSeries ? (item as SeriesItem).series_id : (item as VodStream).stream_id) : 0;

  useEffect(() => {
    if (!item) return;
    const favKey = `${type}_${id}`;
    setFavorite(isFavorite(favKey));

    if (isSeries) {
      setLoadingSeries(true);
      fetchSeriesInfo(id)
        .then((data) => {
          setSeriesData(data);
          if (data.episodes) {
            const seasonKeys = Object.keys(data.episodes);
            if (seasonKeys.length > 0) {
              setActiveSeason(seasonKeys[0]);
            }
          }
        })
        .catch((err) => console.error("Error loading series info", err))
        .finally(() => setLoadingSeries(false));
    }
  }, [item, id, isSeries, type]);

  // Tecla Voltar (Return / 10009 / Esc / Back) do controle remoto da TV volta ao catálogo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "Escape" ||
        e.key === "Return" ||
        e.keyCode === 10009 ||
        e.key === "Back" ||
        e.key === "GoBack" ||
        e.keyCode === 27
      ) {
        e.preventDefault();
        e.stopPropagation();
        onBack();
      }
    };
    const handleTizen = (e: any) => {
      if (e.keyName === "back") {
        e.preventDefault();
        onBack();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("tizenhwkey", handleTizen);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("tizenhwkey", handleTizen);
    };
  }, [onBack]);

  // Foco inicial automático no botão de Play na TV
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    const timer = setTimeout(() => {
      const primaryBtn =
        document.querySelector<HTMLElement>('button[data-tv-primary="true"]') ||
        document.querySelector<HTMLElement>('main button');
      if (primaryBtn) {
        primaryBtn.focus();
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [item]);

  if (!item) return null;

  const rawTitle = item.title || item.name || "Detalhes";
  const title = rawTitle.replace(/\s*\(\d{4}\)$/, "").trim();
  const parsedYear = extractReleaseYear(item as any);
  const year = parsedYear > 0 ? String(parsedYear) : (item.year || rawTitle.match(/\((\d{4})\)/)?.[1] || "");
  const rating = item.rating || item.rating_5based;
  const genre = item.genre || "";
  const plot = item.plot || "Sinopse não disponível para este título.";
  const cast = item.cast || "";
  const director = item.director || "";

  let backdropUrl = "";
  if (item.backdrop_path && item.backdrop_path.length > 0) {
    backdropUrl = item.backdrop_path[0];
  } else if ("cover" in item && item.cover) {
    backdropUrl = item.cover;
  } else if ("stream_icon" in item && item.stream_icon) {
    backdropUrl = item.stream_icon;
  }
  const cleanBackdrop = formatImageUrl(backdropUrl);

  let posterUrl = "";
  if ("cover" in item && item.cover) {
    posterUrl = item.cover;
  } else if ("stream_icon" in item && item.stream_icon) {
    posterUrl = item.stream_icon;
  }
  const cleanPoster = formatImageUrl(posterUrl);

  const toggleFav = () => {
    const favKey = `${type}_${id}`;
    if (favorite) {
      removeFavorite(favKey);
      setFavorite(false);
    } else {
      saveFavorite({
        id: favKey,
        type,
        title,
        poster: cleanPoster,
        year,
        rating,
        item,
      });
      setFavorite(true);
    }
  };

  const handlePlayMovie = () => {
    const vod = item as VodStream;
    onPlay({
      type: "movie",
      id: Number(vod.stream_id),
      title,
      poster: cleanPoster,
      year,
      rating,
      plot: vod.plot,
      cast: vod.cast,
      director: vod.director,
      genre: vod.genre,
      streamUrl: getMovieStreamUrl(vod.stream_id, vod.container_extension || "mp4"),
    });
  };

  const handlePlayEpisode = (episode: EpisodeInfo, allSeasonEps: EpisodeInfo[], epIndex: number) => {
    const next = allSeasonEps[epIndex + 1];
    onPlay({
      type: "episode",
      id: episode.id,
      seriesId: Number(id),
      seriesTitle: title,
      title: episode.title || `Episódio ${episode.episode_num}`,
      season: Number(activeSeason),
      episodeNum: episode.episode_num,
      poster: formatImageUrl(episode.info?.movie_image || episode.info?.cover_big || cleanPoster),
      plot: episode.info?.plot || plot,
      streamUrl: getEpisodeStreamUrl(episode.id, episode.container_extension || "mp4"),
      nextEpisode: next
        ? {
            id: next.id,
            title: next.title || `Episódio ${next.episode_num}`,
            season: Number(activeSeason),
            episodeNum: next.episode_num,
          }
        : undefined,
    });
  };

  const episodes = seriesData?.episodes ? seriesData.episodes[activeSeason] || [] : [];
  const seasonList = seriesData?.episodes ? Object.keys(seriesData.episodes) : [];

  return (
    <div className="min-h-screen py-4 sm:py-6 px-4 sm:px-6 lg:px-10 max-w-[1600px] mx-auto animate-fade-in select-none">
      {/* Botão de Voltar ao Catálogo */}
      <div className="mb-5 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-surface-light hover:bg-white/10 text-gray-200 hover:text-white border border-white/10 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400 group"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-400 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs sm:text-sm font-bold">Voltar ao Catálogo</span>
        </button>

        <span className="text-xs text-gray-500 hidden sm:inline">
          Pressione <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-gray-300 font-mono text-[11px]">Voltar</kbd> no controle
        </span>
      </div>

      {/* Hero Banner do Filme / Série */}
      <div className="relative rounded-3xl overflow-hidden bg-[#0d1017] border border-white/10 shadow-2xl mb-8">
        <div className="relative h-72 sm:h-96 md:h-[460px] w-full overflow-hidden bg-black">
          {cleanBackdrop ? (
            <img
              src={cleanBackdrop}
              alt={title}
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-emerald-950/40 via-surface to-background" />
          )}

          {/* Gradients cinematográficos */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d1017] via-[#0d1017]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d1017] via-[#0d1017]/70 to-transparent w-full md:w-3/4" />

          {/* Conteúdo sobre o Backdrop */}
          <div className="absolute bottom-6 sm:bottom-10 left-6 sm:left-10 right-6 sm:right-10 flex flex-col justify-end max-w-3xl">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2.5 mb-3">
              <span className="px-3 py-1 rounded-lg bg-emerald-500 text-[11px] font-black text-black uppercase tracking-wider shadow">
                {isSeries ? "Série Completa" : "Filme"}
              </span>

              {rating && Number(rating) > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-xs font-bold text-amber-400 border border-white/10">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{typeof rating === "number" ? rating.toFixed(1) : rating}</span>
                </div>
              )}

              {year && (
                <span className="text-xs font-bold text-gray-200 px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-md border border-white/10">
                  {year}
                </span>
              )}

              {genre && (
                <span className="text-xs text-gray-300 hidden sm:inline">
                  • {genre.split(",").slice(0, 3).join(", ")}
                </span>
              )}
            </div>

            {/* Título */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white drop-shadow-lg tracking-tight mb-4">
              {title}
            </h1>

            {/* Ações Principais */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              {!isSeries ? (
                <button
                  data-tv-primary="true"
                  onClick={handlePlayMovie}
                  className="flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm sm:text-base shadow-xl shadow-emerald-500/30 transition-all focus:outline-none focus:ring-4 focus:ring-emerald-300 focus:bg-emerald-400 cursor-pointer group"
                >
                  <Play className="w-5 h-5 fill-black text-black group-hover:scale-110 transition-transform" />
                  <span>Assistir Filme</span>
                </button>
              ) : episodes.length > 0 ? (
                <button
                  data-tv-primary="true"
                  onClick={() => handlePlayEpisode(episodes[0], episodes, 0)}
                  className="flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm sm:text-base shadow-xl shadow-emerald-500/30 transition-all focus:outline-none focus:ring-4 focus:ring-emerald-300 focus:bg-emerald-400 cursor-pointer group"
                >
                  <Play className="w-5 h-5 fill-black text-black group-hover:scale-110 transition-transform" />
                  <span>Assistir 1º Episódio</span>
                </button>
              ) : null}

              <button
                onClick={toggleFav}
                className={`flex items-center gap-2 px-5 py-3.5 rounded-2xl text-sm font-semibold border transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
                  favorite
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                    : "bg-surface-light hover:bg-white/10 border-white/10 text-gray-200"
                }`}
              >
                {favorite ? <Check className="w-4 h-4 text-emerald-400" /> : <Plus className="w-4 h-4" />}
                <span>{favorite ? "Na Minha Lista" : "Adicionar à Lista"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Informações: Sinopse, Elenco, Direção */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <div className="lg:col-span-2 bg-surface/80 border border-white/5 rounded-2xl p-6 sm:p-7 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Sinopse</h3>
          <p className="text-gray-200 text-sm sm:text-base leading-relaxed">
            {plot}
          </p>

          {genre && (
            <div className="flex flex-wrap items-center gap-2 pt-3">
              {genre.split(",").map((g, idx) => (
                <span
                  key={idx}
                  className="text-xs px-3 py-1 rounded-lg bg-surface-light text-gray-300 border border-white/5"
                >
                  {g.trim()}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="bg-surface/80 border border-white/5 rounded-2xl p-6 sm:p-7 space-y-4 text-xs sm:text-sm">
          {director && (
            <div>
              <span className="text-gray-400 block font-semibold mb-1">Direção</span>
              <span className="text-gray-100 font-medium">{director}</span>
            </div>
          )}
          {cast && (
            <div>
              <span className="text-gray-400 block font-semibold mb-1">Elenco Principal</span>
              <span className="text-gray-200 leading-relaxed">{cast}</span>
            </div>
          )}
          {year && (
            <div>
              <span className="text-gray-400 block font-semibold mb-1">Lançamento</span>
              <span className="text-gray-200">{year}</span>
            </div>
          )}
        </div>
      </div>

      {/* Temporadas e Episódios (Para Séries) */}
      {isSeries && (
        <div className="bg-surface/80 border border-white/5 rounded-2xl p-6 sm:p-7 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2.5">
              <Tv className="w-5 h-5 text-emerald-400" />
              <span>Temporadas e Episódios</span>
            </h3>

            {/* Abas de Temporada */}
            {seasonList.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {seasonList.map((season) => (
                  <button
                    key={season}
                    onClick={() => setActiveSeason(season)}
                    className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
                      activeSeason === season
                        ? "bg-emerald-500 text-black font-extrabold shadow-lg shadow-emerald-500/25"
                        : "bg-surface-light text-gray-300 hover:bg-white/10 border border-white/5"
                    }`}
                  >
                    Temporada {season}
                  </button>
                ))}
              </div>
            )}
          </div>

          {loadingSeries ? (
            <div className="py-16 flex flex-col items-center justify-center text-gray-400">
              <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-emerald-500 animate-spin mb-3" />
              <span className="text-xs sm:text-sm">Carregando episódios...</span>
            </div>
          ) : episodes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {episodes.map((ep, idx) => {
                const epThumb = formatImageUrl(
                  ep.info?.movie_image || ep.info?.cover_big || cleanPoster
                );
                const epTitle = ep.title || ep.info?.name || `Episódio ${ep.episode_num}`;

                return (
                  <div
                    key={ep.id || idx}
                    tabIndex={0}
                    role="button"
                    onClick={() => handlePlayEpisode(ep, episodes, idx)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.keyCode === 13) {
                        e.preventDefault();
                        handlePlayEpisode(ep, episodes, idx);
                      }
                    }}
                    className="group flex gap-3.5 p-3.5 rounded-2xl bg-surface-light/60 hover:bg-surface-light focus:bg-surface-light border border-white/5 hover:border-emerald-500/40 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer transition-all"
                  >
                    {/* Thumbnail */}
                    <div className="relative w-28 sm:w-32 h-20 rounded-xl overflow-hidden bg-black/60 flex-shrink-0">
                      {epThumb ? (
                        <img
                          src={epThumb}
                          alt={epTitle}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600">
                          <Film className="w-6 h-6" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 flex items-center justify-center transition-all">
                        <div className="p-2 rounded-full bg-emerald-500 text-black shadow-lg opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-transform">
                          <Play className="w-4 h-4 fill-black text-black" />
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 flex flex-col justify-center min-w-0">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 uppercase mb-1">
                        <span>Ep. {ep.episode_num}</span>
                        {ep.info?.duration_secs ? (
                          <span className="text-gray-400">
                            • {Math.round(Number(ep.info.duration_secs) / 60)} min
                          </span>
                        ) : null}
                      </div>
                      <h4 className="text-xs sm:text-sm font-semibold text-white line-clamp-1 group-hover:text-emerald-400 transition-colors">
                        {epTitle}
                      </h4>
                      {ep.info?.plot && (
                        <p className="text-[11px] text-gray-400 line-clamp-2 mt-1 leading-snug">
                          {ep.info.plot}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-400 text-sm">
              Nenhum episódio encontrado para esta temporada.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
