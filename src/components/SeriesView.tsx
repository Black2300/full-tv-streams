"use client";

import React, { useState, useMemo } from "react";
import { Video, Search, Sparkles } from "lucide-react";
import { Category, SeriesItem } from "@/types/iptv";
import { cleanCategoryName } from "@/services/iptv";
import { StreamCard } from "./StreamCard";

interface SeriesViewProps {
  categories: Category[];
  series: SeriesItem[];
  onSelect: (item: SeriesItem, type: "series") => void;
  activeCategoryId?: string;
  onSelectCategory?: (catId: string) => void;
  isLoading?: boolean;
}

export const SeriesView: React.FC<SeriesViewProps> = ({
  categories,
  series,
  onSelect,
  activeCategoryId,
  onSelectCategory,
  isLoading,
}) => {
  const [selectedCat, setSelectedCat] = useState<string>(activeCategoryId || (categories[0]?.category_id || "all"));
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "rating" | "az">("recent");

  const handleCategoryClick = (catId: string) => {
    setSelectedCat(catId);
    onSelectCategory?.(catId);
  };

  const filteredSeries = useMemo(() => {
    let list = series.filter((s) => {
      if (selectedCat !== "all" && s.category_id !== selectedCat) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const title = (s.title || s.name || "").toLowerCase();
        const genre = (s.genre || "").toLowerCase();
        if (!title.includes(q) && !genre.includes(q)) return false;
      }
      return true;
    });

    if (sortBy === "rating") {
      list.sort((a, b) => {
        const rA = Number(a.rating || a.rating_5based || 0);
        const rB = Number(b.rating || b.rating_5based || 0);
        return rB - rA;
      });
    } else if (sortBy === "az") {
      list.sort((a, b) => (a.title || a.name || "").localeCompare(b.title || b.name || ""));
    } else {
      list.sort((a, b) => Number(b.series_id || 0) - Number(a.series_id || 0));
    }

    return list;
  }, [series, selectedCat, search, sortBy]);

  const activeCategoryObj = categories.find((c) => c.category_id === selectedCat);

  return (
    <div className="pt-24 sm:pt-28 pb-16 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
      {/* Title & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-red-600/20 text-red-500 border border-red-500/30">
              <Video className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Catálogo de Séries</h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-400">
            Séries completas organizadas por temporadas e episódios
          </p>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar série ou gênero..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface-light border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-red-500 placeholder-gray-500"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-surface-light border border-white/10 rounded-xl p-1 text-xs">
            <button
              onClick={() => setSortBy("recent")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                sortBy === "recent" ? "bg-red-600 text-white shadow-sm" : "text-gray-400 hover:text-white"
              }`}
            >
              Recentes
            </button>
            <button
              onClick={() => setSortBy("rating")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                sortBy === "rating" ? "bg-red-600 text-white shadow-sm" : "text-gray-400 hover:text-white"
              }`}
            >
              Melhores
            </button>
            <button
              onClick={() => setSortBy("az")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                sortBy === "az" ? "bg-red-600 text-white shadow-sm" : "text-gray-400 hover:text-white"
              }`}
            >
              A-Z
            </button>
          </div>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-6">
        <button
          onClick={() => handleCategoryClick("all")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
            selectedCat === "all"
              ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
              : "bg-surface hover:bg-surface-light text-gray-300 hover:text-white border border-white/5"
          }`}
        >
          Todas as Séries
        </button>

        {categories.map((cat) => (
          <button
            key={cat.category_id}
            onClick={() => handleCategoryClick(cat.category_id)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
              selectedCat === cat.category_id
                ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                : "bg-surface hover:bg-surface-light text-gray-300 hover:text-white border border-white/5"
            }`}
          >
            {cleanCategoryName(cat.category_name)}
          </button>
        ))}
      </div>

      {/* Series Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span>{activeCategoryObj ? cleanCategoryName(activeCategoryObj.category_name) : "Todas as Séries"}</span>
            <span className="text-xs font-normal text-gray-400">
              ({filteredSeries.length} títulos)
            </span>
          </h2>
        </div>

        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center text-gray-400">
            <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-red-600 animate-spin mb-3" />
            <span className="text-sm font-medium">Carregando catálogo de séries...</span>
          </div>
        ) : filteredSeries.length === 0 ? (
          <div className="py-20 text-center bg-surface rounded-2xl border border-white/5 p-8">
            <Video className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-300 mb-1">Nenhuma série encontrada</h3>
            <p className="text-xs text-gray-500">Tente buscar por outro termo ou categoria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
            {filteredSeries.map((s) => (
              <StreamCard
                key={s.series_id}
                item={s}
                type="series"
                categoryName={activeCategoryObj ? cleanCategoryName(activeCategoryObj.category_name) : undefined}
                onPlay={() => {}}
                onSelect={(item) => onSelect(item as SeriesItem, "series")}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
