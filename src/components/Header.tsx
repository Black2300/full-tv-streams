"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Tv,
  Film,
  Video,
  Star,
  Search,
  Settings,
  X,
  Menu,
  Home,
} from "lucide-react";
import { MainTab, PlayableItem, VodStream, SeriesItem, LiveStream } from "@/types/iptv";
import { getLiveStreamUrl } from "@/services/iptv";

interface HeaderProps {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  onOpenSettings: () => void;
  onPlay: (playable: PlayableItem) => void;
  onSelectMedia: (item: VodStream | SeriesItem, type: "movie" | "series") => void;
  allMovies: VodStream[];
  allSeries: SeriesItem[];
  allLive: LiveStream[];
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenSettings,
  onPlay,
  onSelectMedia,
  allMovies,
  allSeries,
  allLive,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const openSearch = () => {
    setIsSearchOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  const closeSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery("");
  };

  // Search results
  const q = searchQuery.trim().toLowerCase();
  const searchResults = q.length >= 2 ? {
    live: allLive.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 5),
    movies: allMovies.filter((m) => (m.title || m.name || "").toLowerCase().includes(q)).slice(0, 6),
    series: allSeries.filter((s) => (s.title || s.name || "").toLowerCase().includes(q)).slice(0, 6),
  } : null;

  const totalResultsCount = searchResults
    ? searchResults.live.length + searchResults.movies.length + searchResults.series.length
    : 0;

  const navItems: { id: MainTab; label: string; icon: React.ReactNode }[] = [
    { id: "home", label: "Início", icon: <Home className="w-4 h-4" /> },
    { id: "live", label: "TV ao Vivo", icon: <Tv className="w-4 h-4" /> },
    { id: "movies", label: "Filmes", icon: <Film className="w-4 h-4" /> },
    { id: "series", label: "Séries", icon: <Video className="w-4 h-4" /> },
    { id: "favorites", label: "Favoritos", icon: <Star className="w-4 h-4" /> },
  ];

  return (
    <header
      className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
        isScrolled
          ? "bg-[#07080c]/95 backdrop-blur-md shadow-xl border-b border-white/5 py-3"
          : "bg-gradient-to-b from-[#07080c]/90 via-[#07080c]/40 to-transparent py-4 sm:py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-6 lg:gap-8">
          <button
            onClick={() => onTabChange("home")}
            className="flex items-center text-left group focus:outline-none py-1"
          >
            <img
              src="/logo.png"
              alt="FULL TV STREAMS"
              className="h-10 w-auto max-w-[180px] object-contain drop-shadow group-hover:scale-105 transition-transform"
            />
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                  activeTab === item.id
                    ? "bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/30"
                    : "text-gray-300 hover:text-white hover:bg-white/5"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search Trigger or Input */}
          <div className="relative">
            {isSearchOpen ? (
              <div className="flex items-center bg-surface-light border border-emerald-500/40 rounded-xl px-3.5 py-2 w-64 sm:w-80 shadow-2xl animate-fade-in">
                <Search className="w-4 h-4 text-emerald-400 mr-2 flex-shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Buscar canal, filme ou série..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-white text-xs sm:text-sm focus:outline-none w-full placeholder-gray-500"
                />
                <button
                  onClick={closeSearch}
                  className="p-1 text-gray-400 hover:text-white rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={openSearch}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white backdrop-blur-md border border-white/10 transition-all hover:border-emerald-500/30"
                title="Pesquisar"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}

            {/* Instant Search Results Dropdown */}
            {isSearchOpen && q.length >= 2 && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 max-h-[70vh] overflow-y-auto bg-[#0d1017] border border-white/10 rounded-2xl p-4 shadow-2xl z-50 animate-fade-in">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/10">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {totalResultsCount} resultados
                  </span>
                  <button
                    onClick={closeSearch}
                    className="text-xs text-emerald-400 hover:text-emerald-300"
                  >
                    Fechar
                  </button>
                </div>

                {totalResultsCount === 0 ? (
                  <div className="py-8 text-center text-gray-400 text-xs">
                    Nenhum título encontrado para &ldquo;{searchQuery}&rdquo;.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Live TV Channels */}
                    {searchResults && searchResults.live.length > 0 && (
                      <div>
                        <h4 className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Tv className="w-3.5 h-3.5" />
                          <span>Canais ao Vivo</span>
                        </h4>
                        <div className="space-y-1.5">
                          {searchResults.live.map((ch) => (
                            <div
                              key={ch.stream_id}
                              onClick={() => {
                                onPlay({
                                  type: "live",
                                  id: ch.stream_id,
                                  title: ch.name,
                                  poster: ch.stream_icon,
                                  streamUrl: getLiveStreamUrl(ch.stream_id),
                                });
                                closeSearch();
                              }}
                              className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/10 cursor-pointer transition-colors"
                            >
                              <div className="w-7 h-7 rounded-lg bg-black/50 p-1 flex items-center justify-center flex-shrink-0">
                                {ch.stream_icon ? (
                                  <img
                                    src={ch.stream_icon}
                                    alt={ch.name}
                                    className="w-full h-full object-contain"
                                  />
                                ) : (
                                  <Tv className="w-3.5 h-3.5 text-emerald-400" />
                                )}
                              </div>
                              <span className="text-xs text-gray-200 line-clamp-1 font-medium">
                                {ch.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Movies */}
                    {searchResults && searchResults.movies.length > 0 && (
                      <div>
                        <h4 className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Film className="w-3.5 h-3.5" />
                          <span>Filmes</span>
                        </h4>
                        <div className="space-y-1.5">
                          {searchResults.movies.map((m) => (
                            <div
                              key={m.stream_id}
                              onClick={() => {
                                onSelectMedia(m, "movie");
                                closeSearch();
                              }}
                              className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/10 cursor-pointer transition-colors"
                            >
                              <div className="w-7 h-10 rounded-md bg-black/50 overflow-hidden flex-shrink-0">
                                {m.stream_icon ? (
                                  <img
                                    src={m.stream_icon}
                                    alt={m.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Film className="w-4 h-4 text-gray-500 m-auto" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-xs text-gray-200 line-clamp-1 font-medium">
                                  {m.title || m.name}
                                </span>
                                {m.year && (
                                  <span className="text-[10px] text-gray-400">{m.year}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Series */}
                    {searchResults && searchResults.series.length > 0 && (
                      <div>
                        <h4 className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Video className="w-3.5 h-3.5" />
                          <span>Séries</span>
                        </h4>
                        <div className="space-y-1.5">
                          {searchResults.series.map((s) => (
                            <div
                              key={s.series_id}
                              onClick={() => {
                                onSelectMedia(s, "series");
                                closeSearch();
                              }}
                              className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/10 cursor-pointer transition-colors"
                            >
                              <div className="w-7 h-10 rounded-md bg-black/50 overflow-hidden flex-shrink-0">
                                {s.cover ? (
                                  <img
                                    src={s.cover}
                                    alt={s.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Video className="w-4 h-4 text-gray-500 m-auto" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-xs text-gray-200 line-clamp-1 font-medium">
                                  {s.title || s.name}
                                </span>
                                {s.year && (
                                  <span className="text-[10px] text-gray-400">{s.year}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Connection Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-light border border-white/5 text-xs font-semibold text-gray-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden md:inline">Online</span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-400 font-mono text-[11px]">kettericasa</span>
          </div>

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white backdrop-blur-md border border-white/10 transition-all hover:border-emerald-500/30"
            title="Configurações da Conta"
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-[#07080c]/98 backdrop-blur-2xl border-b border-white/10 px-4 py-4 space-y-2 animate-fade-in shadow-2xl">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === item.id
                  ? "bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/30"
                  : "text-gray-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </header>
  );
};
