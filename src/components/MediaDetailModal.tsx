"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Play,
  Star,
  Plus,
  Check,
  Calendar,
  Clock,
  Film,
  Tv,
  Users,
  UserCheck,
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
} from "@/services/iptv";
import { isFavorite, removeFavorite, saveFavorite } from "@/services/storage";

interface MediaDetailModalProps {
  item: VodStream | SeriesItem | null;
  type: "movie" | "series";
  onClose: () => void;
  onPlay: (playable: PlayableItem) => void;
}

export const MediaDetailModal: React.FC<MediaDetailModalProps> = ({
  item,
  type,
  onClose,
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

  if (!item) return null;

  const rawTitle = item.title || item.name || "Detalhes";
  const title = rawTitle.replace(/\s*\(\d{4}\)$/, "").trim();
  const year = item.year || (rawTitle.match(/\((\d{4})\)/)?.[1]) || "";
  const rating = item.rating || item.rating_5based;
  const genre = item.genre || "";
  const plot = item.plot || "Sinopse não disponível para este título.";
  const cast = item.cast || "";
  const director = item.director || "";

  // Resolve best backdrop & poster
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
    onClose();
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
    onClose();
  };

  const episodes = seriesData?.episodes ? seriesData.episodes[activeSeason] || [] : [];
  const seasonList = seriesData?.episodes ? Object.keys(seriesData.episodes) : [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 select-none animate-fade-in">
      {/* Click outside to close */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      <div className="relative w-full max-w-4xl bg-[#12141c] border border-white/10 rounded-2xl overflow-hidden shadow-2xl my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-black/70 hover:bg-red-600 text-white backdrop-blur-md border border-white/15 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Backdrop Header */}
        <div className="relative h-60 sm:h-80 md:h-96 w-full overflow-hidden bg-black">
          {cleanBackdrop ? (
            <img
              src={cleanBackdrop}
              alt={title}
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-red-950/40 via-surface to-background" />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-[#12141c] via-[#12141c]/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#12141c] via-[#12141c]/60 to-transparent w-full md:w-2/3" />

          {/* Quick info over backdrop */}
          <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-md bg-red-600 text-[11px] font-extrabold text-white uppercase tracking-wider shadow">
                  {isSeries ? "Série" : "Filme"}
                </span>
                {rating && Number(rating) > 0 && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-xs font-bold text-amber-400 border border-white/10">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{typeof rating === "number" ? rating.toFixed(1) : rating}</span>
                  </div>
                )}
                {year && <span className="text-xs font-semibold text-gray-300">{year}</span>}
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white drop-shadow-md">
                {title}
              </h2>
            </div>

            {!isSeries && (
              <button
                onClick={handlePlayMovie}
                className="hidden sm:flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold shadow-xl shadow-red-600/40 transition-all transform hover:scale-105 active:scale-95"
              >
                <Play className="w-5 h-5 fill-white" />
                <span>Assistir Filme</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Action Row for Mobile / Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {!isSeries && (
              <button
                onClick={handlePlayMovie}
                className="sm:hidden flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg shadow-red-600/30"
              >
                <Play className="w-5 h-5 fill-white" />
                <span>Assistir Filme</span>
              </button>
            )}

            <button
              onClick={toggleFav}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                favorite
                  ? "bg-red-600/20 border-red-500 text-red-400"
                  : "bg-surface-light hover:bg-white/10 border-white/10 text-gray-200"
              }`}
            >
              {favorite ? <Check className="w-4 h-4 text-red-500" /> : <Plus className="w-4 h-4" />}
              <span>{favorite ? "Na Minha Lista" : "Adicionar à Lista"}</span>
            </button>

            {genre && (
              <div className="flex flex-wrap items-center gap-1.5 ml-auto">
                {genre.split(",").map((g, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2.5 py-1 rounded-lg bg-surface-light text-gray-300 border border-white/5"
                  >
                    {g.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Synopsis & Cast */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Sinopse</h3>
              <p className="text-gray-300 text-sm leading-relaxed">{plot}</p>
            </div>

            <div className="space-y-3 bg-surface-light/50 p-4 rounded-xl border border-white/5 text-xs">
              {director && (
                <div>
                  <span className="text-gray-400 block font-semibold mb-0.5">Direção</span>
                  <span className="text-gray-200">{director}</span>
                </div>
              )}
              {cast && (
                <div>
                  <span className="text-gray-400 block font-semibold mb-0.5">Elenco</span>
                  <span className="text-gray-200 line-clamp-4">{cast}</span>
                </div>
              )}
            </div>
          </div>

          {/* Series Seasons & Episodes Section */}
          {isSeries && (
            <div className="pt-4 border-t border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Tv className="w-5 h-5 text-red-500" />
                  <span>Temporadas e Episódios</span>
                </h3>

                {/* Season Selector Tabs */}
                {seasonList.length > 1 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    {seasonList.map((season) => (
                      <button
                        key={season}
                        onClick={() => setActiveSeason(season)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                          activeSeason === season
                            ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                            : "bg-surface-light text-gray-300 hover:bg-white/10"
                        }`}
                      >
                        Temporada {season}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {loadingSeries ? (
                <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                  <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-red-600 animate-spin mb-3" />
                  <span className="text-xs">Carregando lista de episódios...</span>
                </div>
              ) : episodes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                  {episodes.map((ep, idx) => {
                    const epThumb = formatImageUrl(
                      ep.info?.movie_image || ep.info?.cover_big || cleanPoster
                    );
                    const epTitle = ep.title || ep.info?.name || `Episódio ${ep.episode_num}`;

                    return (
                      <div
                        key={ep.id || idx}
                        onClick={() => handlePlayEpisode(ep, episodes, idx)}
                        className="group flex gap-3 p-2.5 rounded-xl bg-surface-light/60 hover:bg-surface-light border border-white/5 hover:border-red-500/40 cursor-pointer transition-all"
                      >
                        {/* Thumbnail */}
                        <div className="relative w-24 sm:w-28 h-16 rounded-lg overflow-hidden bg-black/50 flex-shrink-0">
                          {epThumb ? (
                            <img
                              src={epThumb}
                              alt={epTitle}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-600">
                              <Film className="w-6 h-6" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 flex items-center justify-center transition-all">
                            <div className="p-1.5 rounded-full bg-red-600 text-white opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-transform">
                              <Play className="w-3 h-3 fill-white" />
                            </div>
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 flex flex-col justify-center min-w-0">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-400 uppercase">
                            <span>Ep. {ep.episode_num}</span>
                            {ep.info?.duration_secs ? (
                              <span className="text-gray-400">
                                • {Math.round(Number(ep.info.duration_secs) / 60)} min
                              </span>
                            ) : null}
                          </div>
                          <h4 className="text-xs sm:text-sm font-semibold text-white line-clamp-1 group-hover:text-red-400 transition-colors">
                            {epTitle}
                          </h4>
                          {ep.info?.plot && (
                            <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">
                              {ep.info.plot}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-400 text-sm">
                  Nenhum episódio encontrado para esta temporada.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
