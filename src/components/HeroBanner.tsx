"use client";

import React, { useState, useEffect } from "react";
import { Play, Info, Plus, Check, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { PlayableItem, VodStream, SeriesItem } from "@/types/iptv";
import { formatImageUrl, getMovieStreamUrl } from "@/services/iptv";
import { isFavorite, removeFavorite, saveFavorite } from "@/services/storage";

interface HeroBannerProps {
  items: (VodStream | SeriesItem)[];
  onPlay: (playable: PlayableItem) => void;
  onSelect: (item: VodStream | SeriesItem, type: "movie" | "series") => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ items, onPlay, onSelect }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const validItems = items.filter((item) => {
    const hasBackdrop = (item as any).backdrop_path?.length > 0;
    const hasPoster = (item as any).stream_icon || (item as any).cover;
    return hasBackdrop || hasPoster;
  });

  const featuredList = validItems.length > 0 ? validItems.slice(0, 7) : items.slice(0, 5);

  useEffect(() => {
    if (featuredList.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredList.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [featuredList.length, isPaused]);

  if (featuredList.length === 0) return null;

  const current = featuredList[currentIndex];
  const isSeries = "series_id" in current;
  const id = isSeries ? (current as SeriesItem).series_id : (current as VodStream).stream_id;
  const rawTitle = current.title || current.name || "Em Destaque";
  const title = rawTitle.replace(/\s*\(\d{4}\)$/, "").trim();
  const year = current.year || (rawTitle.match(/\((\d{4})\)/)?.[1]) || "";
  const rating = current.rating || current.rating_5based;
  const genre = current.genre || "";
  const plot = current.plot || "Assista a este título incrível disponível agora mesmo na Full TV Streams com alta qualidade e sem travamentos.";

  let backdropUrl = "";
  if (current.backdrop_path && current.backdrop_path.length > 0) {
    backdropUrl = current.backdrop_path[0];
  } else if ("stream_icon" in current && current.stream_icon) {
    backdropUrl = current.stream_icon;
  } else if ("cover" in current && current.cover) {
    backdropUrl = current.cover;
  }
  const cleanBackdrop = formatImageUrl(backdropUrl);

  const favKey = `${isSeries ? "series" : "movie"}_${id}`;
  const favorite = isFavorite(favKey);

  const toggleFav = () => {
    if (favorite) {
      removeFavorite(favKey);
    } else {
      saveFavorite({
        id: favKey,
        type: isSeries ? "series" : "movie",
        title,
        poster: cleanBackdrop,
        year,
        rating,
        item: current,
      });
    }
  };

  const handlePlayNow = () => {
    if (isSeries) {
      onSelect(current, "series");
    } else {
      const vod = current as VodStream;
      onPlay({
        type: "movie",
        id: Number(vod.stream_id),
        title,
        poster: cleanBackdrop,
        year,
        rating,
        plot: vod.plot,
        cast: vod.cast,
        director: vod.director,
        genre: vod.genre,
        streamUrl: getMovieStreamUrl(vod.stream_id, vod.container_extension || "mp4"),
      });
    }
  };

  return (
    <div
      className="relative w-full h-[65vh] sm:h-[75vh] md:h-[82vh] overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Backdrop */}
      <div className="absolute inset-0">
        {cleanBackdrop ? (
          <img
            key={cleanBackdrop}
            src={cleanBackdrop}
            alt={title}
            className="w-full h-full object-cover object-center animate-fade-in transition-transform duration-1000 scale-100 hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-950/30 via-surface to-background" />
        )}

        {/* Cinematic Vignettes */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07080c] via-[#07080c]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07080c] via-[#07080c]/75 to-transparent w-full md:w-3/4" />
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[#07080c]/90 to-transparent" />
      </div>

      {/* Featured Info Container */}
      <div className="relative z-10 h-full flex flex-col justify-end pb-12 sm:pb-16 md:pb-20 px-4 sm:px-8 lg:px-12 max-w-4xl">
        {/* Badges */}
        <div className="flex items-center gap-2 mb-3">
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-extrabold text-[11px] tracking-wider uppercase shadow-sm">
            {isSeries ? "Série em Alta" : "Filme em Destaque"}
          </span>
          {rating && Number(rating) > 0 && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-xs font-bold text-amber-400 border border-amber-400/20">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{typeof rating === "number" ? rating.toFixed(1) : rating}</span>
            </div>
          )}
          {year && (
            <span className="text-xs font-semibold text-gray-300 ml-1">
              {year}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight sm:leading-none drop-shadow-xl line-clamp-2 mb-3">
          {title}
        </h1>

        {/* Genres */}
        {genre && (
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {genre.split(",").slice(0, 3).map((g, idx) => (
              <span
                key={idx}
                className="text-[11px] sm:text-xs font-medium px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-md text-gray-200 border border-white/5"
              >
                {g.trim()}
              </span>
            ))}
          </div>
        )}

        {/* Plot Synopsis */}
        <p className="text-gray-300 text-xs sm:text-sm md:text-base line-clamp-3 sm:line-clamp-4 max-w-2xl drop-shadow mb-6 leading-relaxed">
          {plot}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <button
            data-tv-hero="true"
            onClick={handlePlayNow}
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm sm:text-base shadow-xl shadow-emerald-500/30 transition-all duration-200 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-emerald-400 focus:scale-105"
          >
            <Play className="w-5 h-5 fill-black text-black" />
            <span>Assistir Agora</span>
          </button>

          <button
            onClick={() => onSelect(current, isSeries ? "series" : "movie")}
            className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-sm sm:text-base backdrop-blur-md border border-white/15 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-emerald-400 focus:scale-105"
          >
            <Info className="w-5 h-5" />
            <span>Mais Detalhes</span>
          </button>

          <button
            onClick={toggleFav}
            title={favorite ? "Remover da minha lista" : "Adicionar à minha lista"}
            className={`p-3.5 rounded-xl backdrop-blur-md transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-emerald-400 focus:scale-105 ${
              favorite
                ? "bg-emerald-500 text-black font-bold shadow-lg shadow-emerald-500/25"
                : "bg-black/50 text-gray-200 hover:text-white hover:bg-black/70 border border-white/15"
            }`}
          >
            {favorite ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="absolute right-4 sm:right-8 lg:right-12 bottom-6 sm:bottom-10 z-20 flex items-center gap-3">
        {/* Indicator Dots */}
        <div className="flex items-center gap-1.5 mr-2">
          {featuredList.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex ? "w-7 bg-emerald-500" : "w-2 bg-white/30 hover:bg-white/50"
              }`}
            />
          ))}
        </div>

        {/* Prev / Next Arrows */}
        <button
          onClick={() => setCurrentIndex((prev) => (prev - 1 + featuredList.length) % featuredList.length)}
          className="p-2.5 rounded-full bg-black/60 hover:bg-emerald-500 hover:text-black text-white backdrop-blur-md border border-white/10 transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => setCurrentIndex((prev) => (prev + 1) % featuredList.length)}
          className="p-2.5 rounded-full bg-black/60 hover:bg-emerald-500 hover:text-black text-white backdrop-blur-md border border-white/10 transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
