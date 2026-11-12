"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Tv,
  Search,
  Play,
  Star,
  ChevronRight,
  ChevronLeft,
  Radio,
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

const ITEMS_PER_PAGE = 18;

export const LiveTvView: React.FC<LiveTvViewProps> = ({
  categories,
  channels,
  onPlay,
  activeCategoryId,
  onSelectCategory,
  isLoading,
}) => {
  const [selectedCat, setSelectedCat] = useState<string>(
    activeCategoryId || (categories[0]?.category_id || "all")
  );
  const [search, setSearch] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCat, search, favoritesOnly]);

  const handleCategoryClick = (catId: string) => {
    setSelectedCat(catId);
    onSelectCategory?.(catId);
  };

  const filteredChannels = useMemo(() => {
    return channels.filter((ch) => {
      if (selectedCat !== "all" && ch.category_id !== selectedCat) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!ch.name.toLowerCase().includes(q)) return false;
      }
      if (favoritesOnly) {
        if (!isFavorite(`live_${ch.stream_id}`)) return false;
      }
      return true;
    });
  }, [channels, selectedCat, search, favoritesOnly]);

  const totalPages = Math.max(1, Math.ceil(filteredChannels.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedChannels = filteredChannels.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const activeCategoryObj = categories.find((c) => c.category_id === selectedCat);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 100, behavior: "smooth" });
  };

  return (
    <div className="py-6 sm:py-8 px-4 sm:px-6 lg:px-10 max-w-[1600px] mx-auto animate-fade-in">
      {/* Title & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Radio className="w-5 h-5 animate-pulse" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Guia de TV ao Vivo</h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-400">
            {filteredChannels.length} canais disponíveis • {ITEMS_PER_PAGE} por página para máxima leveza na Smart TV
          </p>
        </div>

        {/* Search & Favorites Toggle */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400" />
            <input
              type="text"
              placeholder="Buscar canal ao vivo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-light border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 placeholder-gray-500"
            />
          </div>

          <button
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
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
        <div className="lg:col-span-1 space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Categorias ({categories.length})
            </span>
          </div>

          {/* Category List */}
          <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-y-auto max-h-[580px] no-scrollbar py-1">
            <button
              onClick={() => handleCategoryClick("all")}
              className={`flex-shrink-0 flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
                selectedCat === "all"
                  ? "bg-emerald-500 text-black font-extrabold shadow-lg shadow-emerald-500/25"
                  : "bg-surface hover:bg-surface-light text-gray-300 hover:text-white border border-white/5"
              }`}
            >
              <div className="flex items-center gap-2">
                <Flame className={`w-4 h-4 ${selectedCat === "all" ? "text-black" : "text-amber-400"}`} />
                <span>Todos os Canais</span>
              </div>
              <span className="text-[11px] opacity-75 font-mono ml-2">
                {channels.length}
              </span>
            </button>

            {categories.map((cat) => {
              const isSelected = selectedCat === cat.category_id;
              return (
                <button
                  key={cat.category_id}
                  onClick={() => handleCategoryClick(cat.category_id)}
                  className={`flex-shrink-0 flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
                    isSelected
                      ? "bg-emerald-500 text-black font-extrabold shadow-lg shadow-emerald-500/25"
                      : "bg-surface hover:bg-surface-light text-gray-300 hover:text-white border border-white/5"
                  }`}
                >
                  <span className="truncate max-w-[180px]">{cat.category_name}</span>
                  <ChevronRight className={`w-3.5 h-3.5 ml-2 flex-shrink-0 ${isSelected ? "text-black" : "opacity-40"}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Channels Grid */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>{activeCategoryObj?.category_name || "Todos os Canais"}</span>
              <span className="text-xs font-normal text-emerald-400">
                (Página {currentPage} de {totalPages})
              </span>
            </h2>
          </div>

          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center text-gray-400">
              <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-emerald-500 animate-spin mb-3" />
              <span className="text-sm font-medium">Carregando canais...</span>
            </div>
          ) : paginatedChannels.length === 0 ? (
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
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {paginatedChannels.map((channel) => {
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
                      tabIndex={0}
                      role="button"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.keyCode === 13) {
                          e.preventDefault();
                          handlePlay();
                        }
                      }}
                      className="group relative flex items-center gap-3.5 p-3 rounded-2xl bg-surface hover:bg-surface-light border border-white/5 hover:border-emerald-500/40 focus:border-emerald-400 focus:scale-[1.04] focus:ring-4 focus:ring-emerald-400 focus:outline-none cursor-pointer transition-all duration-200 shadow-sm hover:shadow-lg hover:shadow-emerald-950/20"
                    >
                      {/* Channel Logo */}
                      <div className="relative w-14 h-14 rounded-xl bg-black/60 p-2 flex items-center justify-center overflow-hidden flex-shrink-0 border border-white/10 group-hover:border-emerald-500/40">
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
                          <Tv className="w-6 h-6 text-emerald-400 opacity-60" />
                        )}

                        <div className="absolute inset-0 bg-emerald-500/85 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Play className="w-5 h-5 fill-black text-black" />
                        </div>
                      </div>

                      {/* Channel Name */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-[10px] font-extrabold text-emerald-400 tracking-wider">
                            AO VIVO
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-white truncate group-hover:text-emerald-400 transition-colors">
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

              {/* TV Pagination */}
              {totalPages > 1 && (
                <div className="mt-10 flex flex-wrap items-center justify-center gap-3 py-4 border-t border-white/5">
                  <button
                    onClick={() => goToPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
                      currentPage === 1
                        ? "bg-surface-light text-gray-600 cursor-not-allowed border border-white/5"
                        : "bg-surface hover:bg-emerald-500 hover:text-black text-gray-200 border border-white/10 active:scale-95"
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Página Anterior</span>
                  </button>

                  <div className="flex items-center gap-1.5 px-3 py-1 bg-surface-light rounded-xl border border-white/5">
                    <span className="text-xs text-gray-400">Página</span>
                    <span className="text-sm font-black text-emerald-400">{currentPage}</span>
                    <span className="text-xs text-gray-400">de {totalPages}</span>
                  </div>

                  <button
                    onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
                      currentPage === totalPages
                        ? "bg-surface-light text-gray-600 cursor-not-allowed border border-white/5"
                        : "bg-surface hover:bg-emerald-500 hover:text-black text-gray-200 border border-white/10 active:scale-95"
                    }`}
                  >
                    <span>Próxima Página</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
