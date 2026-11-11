"use client";

import React, { useState, useEffect } from "react";
import { Star, Tv, Film, Video, Trash2, Play } from "lucide-react";
import { FavoriteItem, PlayableItem, VodStream, SeriesItem } from "@/types/iptv";
import { getFavorites, removeFavorite } from "@/services/storage";
import { StreamCard } from "./StreamCard";

interface FavoritesViewProps {
  onPlay: (playable: PlayableItem) => void;
  onSelectMedia: (item: VodStream | SeriesItem, type: "movie" | "series") => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({ onPlay, onSelectMedia }) => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [filterType, setFilterType] = useState<"all" | "live" | "movie" | "series">("all");

  useEffect(() => {
    setFavorites(getFavorites());
  }, []);

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = removeFavorite(id);
    setFavorites(updated);
  };

  const filtered = favorites.filter((f) => {
    if (filterType === "all") return true;
    return f.type === filterType;
  });

  return (
    <div className="pt-24 sm:pt-28 pb-16 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Star className="w-5 h-5 fill-amber-400" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Minha Lista de Favoritos</h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-400">
            Acesso rápido aos seus canais, filmes e séries favoritos
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-surface-light border border-white/10 rounded-xl p-1 text-xs">
          <button
            onClick={() => setFilterType("all")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              filterType === "all" ? "bg-red-600 text-white shadow-sm" : "text-gray-400 hover:text-white"
            }`}
          >
            Todos ({favorites.length})
          </button>
          <button
            onClick={() => setFilterType("live")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              filterType === "live" ? "bg-red-600 text-white shadow-sm" : "text-gray-400 hover:text-white"
            }`}
          >
            TV
          </button>
          <button
            onClick={() => setFilterType("movie")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              filterType === "movie" ? "bg-red-600 text-white shadow-sm" : "text-gray-400 hover:text-white"
            }`}
          >
            Filmes
          </button>
          <button
            onClick={() => setFilterType("series")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              filterType === "series" ? "bg-red-600 text-white shadow-sm" : "text-gray-400 hover:text-white"
            }`}
          >
            Séries
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-24 text-center bg-surface rounded-2xl border border-white/5 p-8 max-w-lg mx-auto">
          <Star className="w-14 h-14 text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-200 mb-1">Sua lista está vazia</h3>
          <p className="text-xs sm:text-sm text-gray-400">
            Você ainda não favoritou nenhum canal, filme ou série. Clique no ícone de estrela ou &ldquo;+&rdquo; em qualquer título para salvá-lo aqui.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
          {filtered.map((fav) => (
            <div key={fav.id} className="relative group/fav">
              <StreamCard
                item={fav.item}
                type={fav.type}
                categoryName={fav.category}
                onPlay={onPlay}
                onSelect={(item, t) => {
                  if (t === "live") {
                    // Play live directly
                  } else {
                    onSelectMedia(item as any, t);
                  }
                }}
              />
              <button
                onClick={(e) => handleRemove(fav.id, e)}
                className="absolute top-2 right-2 z-30 p-1.5 rounded-lg bg-black/80 hover:bg-red-600 text-gray-300 hover:text-white border border-white/10 transition-colors opacity-0 group-hover/fav:opacity-100"
                title="Remover dos favoritos"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
