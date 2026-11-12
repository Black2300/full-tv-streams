"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Film, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Category, VodStream, PlayableItem } from "@/types/iptv";
import { cleanCategoryName, extractReleaseYear } from "@/services/iptv";
import { StreamCard } from "./StreamCard";

interface MoviesViewProps {
  categories: Category[];
  movies: VodStream[];
  onPlay: (playable: PlayableItem) => void;
  onSelect: (item: VodStream, type: "movie") => void;
  activeCategoryId?: string;
  onSelectCategory?: (catId: string) => void;
  isLoading?: boolean;
}

const ITEMS_PER_PAGE = 18; // Leve para Smart TV

export const MoviesView: React.FC<MoviesViewProps> = ({
  categories,
  movies,
  onPlay,
  onSelect,
  activeCategoryId,
  onSelectCategory,
  isLoading,
}) => {
  const [selectedCat, setSelectedCat] = useState<string>(
    activeCategoryId || (categories[0]?.category_id || "all")
  );
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "rating" | "az">("recent");
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 when category or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCat, search, sortBy]);

  const handleCategoryClick = (catId: string) => {
    setSelectedCat(catId);
    onSelectCategory?.(catId);
  };

  const filteredMovies = useMemo(() => {
    let list = movies.filter((m) => {
      if (selectedCat !== "all" && m.category_id !== selectedCat) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const title = (m.title || m.name || "").toLowerCase();
        const genre = (m.genre || "").toLowerCase();
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
      // Ordenação padrão: Filmes lançados mais recentemente (2026, 2025, 2024...) sempre no topo
      list.sort((a, b) => {
        const yearA = extractReleaseYear(a);
        const yearB = extractReleaseYear(b);
        if (yearB !== yearA) {
          return yearB - yearA; // Ex: 2026 antes de 2025, 2025 antes de 2024
        }
        return Number(b.stream_id || 0) - Number(a.stream_id || 0);
      });
    }

    return list;
  }, [movies, selectedCat, search, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredMovies.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedMovies = filteredMovies.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const activeCategoryObj = categories.find((c) => c.category_id === selectedCat);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 100, behavior: "smooth" });
  };

  return (
    <div className="py-6 sm:py-8 px-4 sm:px-6 lg:px-10 max-w-[1600px] mx-auto animate-fade-in">
      {/* Title & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Film className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Catálogo de Filmes</h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-400">
            {filteredMovies.length} títulos encontrados • {ITEMS_PER_PAGE} por página para máxima leveza na Smart TV
          </p>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400" />
            <input
              type="text"
              placeholder="Buscar filme ou gênero..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-light border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 placeholder-gray-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-surface-light border border-white/10 rounded-xl p-1 text-xs">
            <button
              onClick={() => setSortBy("recent")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                sortBy === "recent"
                  ? "bg-emerald-500 text-black font-extrabold shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Recentes
            </button>
            <button
              onClick={() => setSortBy("rating")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                sortBy === "rating"
                  ? "bg-emerald-500 text-black font-extrabold shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Melhores
            </button>
            <button
              onClick={() => setSortBy("az")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                sortBy === "az"
                  ? "bg-emerald-500 text-black font-extrabold shadow-sm"
                  : "text-gray-400 hover:text-white"
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
          className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
            selectedCat === "all"
              ? "bg-emerald-500 text-black font-extrabold shadow-lg shadow-emerald-500/25"
              : "bg-surface hover:bg-surface-light text-gray-300 hover:text-white border border-white/5"
          }`}
        >
          Todos os Filmes
        </button>

        {categories.map((cat) => (
          <button
            key={cat.category_id}
            onClick={() => handleCategoryClick(cat.category_id)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
              selectedCat === cat.category_id
                ? "bg-emerald-500 text-black font-extrabold shadow-lg shadow-emerald-500/25"
                : "bg-surface hover:bg-surface-light text-gray-300 hover:text-white border border-white/5"
            }`}
          >
            {cleanCategoryName(cat.category_name)}
          </button>
        ))}
      </div>

      {/* Movies Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span>{activeCategoryObj ? cleanCategoryName(activeCategoryObj.category_name) : "Todos os Filmes"}</span>
            <span className="text-xs font-normal text-emerald-400">
              (Página {currentPage} de {totalPages})
            </span>
          </h2>
        </div>

        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center text-gray-400">
            <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-emerald-500 animate-spin mb-3" />
            <span className="text-sm font-medium">Carregando filmes...</span>
          </div>
        ) : paginatedMovies.length === 0 ? (
          <div className="py-20 text-center bg-surface rounded-2xl border border-white/5 p-8">
            <Film className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-300 mb-1">Nenhum filme encontrado</h3>
            <p className="text-xs text-gray-500">Tente buscar por outro termo ou categoria.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3.5 sm:gap-4.5">
              {paginatedMovies.map((movie) => (
                <StreamCard
                  key={movie.stream_id}
                  item={movie}
                  type="movie"
                  categoryName={activeCategoryObj ? cleanCategoryName(activeCategoryObj.category_name) : undefined}
                  onPlay={onPlay}
                  onSelect={(m) => onSelect(m as VodStream, "movie")}
                />
              ))}
            </div>

            {/* Smart TV Friendly Pagination Controls */}
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
  );
};
