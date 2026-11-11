"use client";

import React, { useState } from "react";
import { Play, Plus, Check, Star, Tv, Film } from "lucide-react";
import { LiveStream, VodStream, SeriesItem, PlayableItem } from "@/types/iptv";
import { formatImageUrl, getLiveStreamUrl, getMovieStreamUrl } from "@/services/iptv";
import { isFavorite, removeFavorite, saveFavorite } from "@/services/storage";

interface StreamCardProps {
  item: LiveStream | VodStream | SeriesItem;
  type: "live" | "movie" | "series";
  categoryName?: string;
  onPlay: (playable: PlayableItem) => void;
  onSelect?: (item: LiveStream | VodStream | SeriesItem, type: "live" | "movie" | "series") => void;
}

export const StreamCard: React.FC<StreamCardProps> = ({
  item,
  type,
  categoryName,
  onPlay,
  onSelect,
}) => {
  const [imgError, setImgError] = useState(false);
  const [favorite, setFavorite] = useState(() => isFavorite(`${type}_${(item as any).stream_id || (item as any).series_id}`));

  const id = type === "series" ? (item as SeriesItem).series_id : (item as LiveStream | VodStream).stream_id;
  const rawTitle = (item as any).title || (item as any).name || "Sem Título";
  const title = rawTitle.replace(/\s*\(\d{4}\)$/, "").trim();
  const year = (item as any).year || (rawTitle.match(/\((\d{4})\)/)?.[1]) || "";
  const rating = (item as any).rating || (item as any).rating_5based;

  // Resolve poster / thumbnail
  let posterUrl = "";
  if (type === "live") {
    posterUrl = (item as LiveStream).stream_icon || "";
  } else if (type === "movie") {
    posterUrl = (item as VodStream).stream_icon || "";
  } else {
    posterUrl = (item as SeriesItem).cover || "";
  }
  const cleanPoster = formatImageUrl(posterUrl);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    const favId = `${type}_${id}`;
    if (favorite) {
      removeFavorite(favId);
      setFavorite(false);
    } else {
      saveFavorite({
        id: favId,
        type,
        title,
        poster: cleanPoster,
        category: categoryName,
        year,
        rating,
        item,
      });
      setFavorite(true);
    }
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (type === "live") {
      onPlay({
        type: "live",
        id: Number(id),
        title,
        poster: cleanPoster,
        category: categoryName,
        streamUrl: getLiveStreamUrl(id),
      });
    } else if (type === "movie") {
      const vod = item as VodStream;
      onPlay({
        type: "movie",
        id: Number(id),
        title,
        poster: cleanPoster,
        category: categoryName,
        year,
        rating,
        plot: vod.plot,
        cast: vod.cast,
        director: vod.director,
        genre: vod.genre,
        streamUrl: getMovieStreamUrl(id, vod.container_extension || "mp4"),
      });
    } else {
      // For series, opening details modal to choose season/episode is the best UX
      if (onSelect) {
        onSelect(item, type);
      }
    }
  };

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(item, type);
    } else {
      handlePlayClick({ stopPropagation: () => {} } as any);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative flex flex-col cursor-pointer rounded-xl overflow-hidden bg-surface transition-all duration-300 hover:scale-[1.03] hover:z-20 hover:shadow-2xl hover:shadow-red-950/40 border border-white/5 hover:border-white/20 ${
        type === "live" ? "aspect-[16/10]" : "aspect-[2/3]"
      }`}
    >
      {/* Poster / Thumbnail Image */}
      <div className="relative w-full h-full overflow-hidden bg-[#161824] flex items-center justify-center">
        {cleanPoster && !imgError ? (
          <img
            src={cleanPoster}
            alt={title}
            onError={() => setImgError(true)}
            loading="lazy"
            className={`w-full h-full transition-transform duration-500 group-hover:scale-105 ${
              type === "live" ? "object-contain p-4" : "object-cover"
            }`}
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-4 text-center text-gray-500">
            {type === "live" ? <Tv className="w-10 h-10 mb-2 opacity-40 text-red-500" /> : <Film className="w-10 h-10 mb-2 opacity-40 text-red-500" />}
            <span className="text-xs line-clamp-2 font-medium">{title}</span>
          </div>
        )}

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 z-10" />

        {/* Live Badge for TV Channels */}
        {type === "live" && (
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-600/90 backdrop-blur-sm text-[10px] font-bold text-white shadow-md">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            <span>AO VIVO</span>
          </div>
        )}

        {/* Rating Badge for Movies & Series */}
        {rating && Number(rating) > 0 && (
          <div className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[11px] font-semibold text-amber-400 border border-white/10 shadow">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{typeof rating === "number" ? rating.toFixed(1) : rating}</span>
          </div>
        )}

        {/* Hover Action Overlay */}
        <div className="absolute inset-0 z-20 flex flex-col justify-between p-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
          {/* Top action buttons */}
          <div className="flex justify-end">
            <button
              onClick={toggleFavorite}
              title={favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
              className={`p-2 rounded-full backdrop-blur-md transition-all ${
                favorite
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/40"
                  : "bg-black/60 text-gray-300 hover:text-white hover:bg-black/80 border border-white/10"
              }`}
            >
              {favorite ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Center Play Button */}
          <div className="flex justify-center items-center">
            <button
              onClick={handlePlayClick}
              className="p-3.5 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-xl shadow-red-600/50 transform group-hover:scale-110 transition-transform duration-200"
            >
              <Play className="w-5 h-5 fill-white" />
            </button>
          </div>

          {/* Bottom Title & Info */}
          <div>
            <h4 className="text-white text-xs sm:text-sm font-semibold line-clamp-1 leading-snug drop-shadow-md">
              {title}
            </h4>
            <div className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-300 mt-1">
              {year && <span>{year}</span>}
              {categoryName && (
                <>
                  <span className="w-1 h-1 rounded-full bg-gray-500" />
                  <span className="truncate max-w-[120px]">{categoryName}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Static Footer below card for Live TV and clean display */}
      <div className="p-2.5 bg-surface/90 flex flex-col justify-between flex-1">
        <h3 className="text-xs sm:text-sm font-medium text-gray-200 line-clamp-1 group-hover:text-red-400 transition-colors">
          {title}
        </h3>
        <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1">
          <span className="truncate">{categoryName || (type === "live" ? "TV ao Vivo" : type === "movie" ? "Filme" : "Série")}</span>
          {year && <span className="text-gray-500">{year}</span>}
        </div>
      </div>
    </div>
  );
};
