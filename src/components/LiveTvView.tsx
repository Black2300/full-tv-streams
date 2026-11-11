"use client";

import React, { useState, useMemo } from "react";
import {
  Tv,
  Search,
  Play,
  Star,
  ChevronRight,
  Radio,
  SlidersHorizontal,
  Flame,
} from "lucide-react";
import { Category, LiveStream, PlayableItem } from "@/types/iptv";
import { getLiveStreamUrl, formatImageUrl } from "@/services/iptv";
import { isFavorite, removeFavorite, saveFavorite } from "@/services/storage";

interface LiveTvViewProps {
  categories: Category[];
  channels: LiveStream[];
  onPlay: (playable: PlayableItem) => void;
  activeCategoryId?: string;
  onSelectCategory?: (catId: string) => void;
  isLoading?: boolean;
}

export const LiveTvView: React.FC<LiveTvViewProps> = ({
  categories,
  channels,
  onPlay,
  activeCategoryId,
  onSelectCategory,
  isLoading,
}) => {
  const [selectedCat, setSelectedCat] = useState<string>(activeCategoryId || (categories[0]?.category_id || "all"));
  const [search, setSearch] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const handleCategoryClick = (catId: string) => {
    setSelectedCat(catId);
    onSelectCategory?.(catId);
  };

  // Filter channels
  const filteredChannels = useMemo(() => {
    return channels.filter((ch) => {
      // Category filter
      if (selectedCat !== "all" && ch.category_id !== selectedCat) {
        return false;
      }
      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!ch.name.toLowerCase().includes(q)) return false;
      }
      // Favorites filter
      if (favoritesOnly) {
        if (!isFavorite(`live_${ch.stream_id}`)) return false;
      }
      return true;
    });
  }, [channels, selectedCat, search, favoritesOnly]);

  const activeCategoryObj = categories.find((c) => c.category_id === selectedCat);

  return (
    <div className="pt-24 sm:pt-28 pb-16 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
      {/* Title & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-red-600/20 text-red-500 border border-red-500/30">
              <Radio className="w-5 h-5 animate-pulse" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Guia de TV ao Vivo</h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-400">
            Transmissões em tempo real com alta definição e baixa latência
          </p>
        </div>

        {/* Search & Favorites Toggle */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar canal ao vivo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-light border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-red-500 placeholder-gray-500"
            />
          </div>

          <button
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
              favoritesOnly
                ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                : "bg-surface-light hover:bg-white/10 text-gray-300 border-white/10"
            }`}
          >
            <Star className={`w-4 h-4 ${favoritesOnly ? "fill-amber-400" : ""}`} />
            <span className="hidden sm:inline">Favoritos</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Categories on Left / Channels on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Categories Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Categorias ({categories.length})
            </span>
          </div>

          {/* Category Pills List */}
          <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-y-auto max-h-[500px] no-scrollbar py-1">
            <button
              onClick={() => handleCategoryClick("all")}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                selectedCat === "all"
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                  : "bg-surface hover:bg-surface-light text-gray-300 hover:text-white border border-white/5"
              }`}
            >
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Todos os Canais</span>
              </div>
              <span className="text-[11px] opacity-75 font-mono ml-2">
                {channels.length}
              </span>
            </button>

            {categories.map((cat) => (
              <button
                key={cat.category_id}
                onClick={() => handleCategoryClick(cat.category_id)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                  selectedCat === cat.category_id
                    ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                    : "bg-surface hover:bg-surface-light text-gray-300 hover:text-white border border-white/5"
                }`}
              >
                <span className="truncate max-w-[180px]">{cat.category_name}</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-50 ml-2 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Right Channels Grid */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>{activeCategoryObj?.category_name || "Todos os Canais"}</span>
              <span className="text-xs font-normal text-gray-400">
                ({filteredChannels.length} canais)
              </span>
            </h2>
          </div>

          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center text-gray-400">
              <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-red-600 animate-spin mb-3" />
              <span className="text-sm font-medium">Carregando lista de canais...</span>
            </div>
          ) : filteredChannels.length === 0 ? (
            <div className="py-20 text-center bg-surface rounded-2xl border border-white/5 p-8">
              <Tv className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-300 mb-1">
                Nenhum canal encontrado
              </h3>
              <p className="text-xs text-gray-500">
                Tente selecionar outra categoria ou limpar a busca.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {filteredChannels.map((channel) => {
                const favId = `live_${channel.stream_id}`;
                const fav = isFavorite(favId);
                const cleanLogo = formatImageUrl(channel.stream_icon);

                const handlePlay = () => {
                  onPlay({
                    type: "live",
                    id: channel.stream_id,
                    title: channel.name,
                    poster: cleanLogo,
                    category: activeCategoryObj?.category_name,
                    streamUrl: getLiveStreamUrl(channel.stream_id),
                  });
                };

                const toggleFav = (e: React.MouseEvent) => {
                  e.stopPropagation();
                  if (fav) {
                    removeFavorite(favId);
                  } else {
                    saveFavorite({
                      id: favId,
                      type: "live",
                      title: channel.name,
                      poster: cleanLogo,
                      category: activeCategoryObj?.category_name,
                      item: channel,
                    });
                  }
                };

                return (
                  <div
                    key={channel.stream_id}
                    onClick={handlePlay}
                    className="group relative flex items-center gap-3.5 p-3 rounded-xl bg-surface hover:bg-surface-light border border-white/5 hover:border-red-500/40 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-lg hover:shadow-red-950/20"
                  >
                    {/* Channel Logo */}
                    <div className="relative w-14 h-14 rounded-xl bg-black/60 p-2 flex items-center justify-center overflow-hidden flex-shrink-0 border border-white/10 group-hover:border-red-500/30">
                      {cleanLogo ? (
                        <img
                          src={cleanLogo}
                          alt={channel.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <Tv className="w-6 h-6 text-red-500 opacity-60" />
                      )}

                      {/* Hover play icon */}
                      <div className="absolute inset-0 bg-red-600/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Play className="w-5 h-5 fill-white text-white" />
                      </div>
                    </div>

                    {/* Channel Name & Category */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                        <span className="text-[10px] font-extrabold text-red-500 tracking-wider">
                          AO VIVO
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-white truncate group-hover:text-red-400 transition-colors">
                        {channel.name}
                      </h4>
                    </div>

                    {/* Favorite Button */}
                    <button
                      onClick={toggleFav}
                      className="p-2 rounded-lg text-gray-400 hover:text-amber-400 hover:bg-white/5 transition-colors"
                      title={fav ? "Remover dos favoritos" : "Favoritar"}
                    >
                      <Star className={`w-4 h-4 ${fav ? "fill-amber-400 text-amber-400" : ""}`} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
