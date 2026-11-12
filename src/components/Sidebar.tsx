"use client";

import React, { useState, useRef } from "react";
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
  Radio,
  Sparkles,
  Download,
  ChevronRight,
} from "lucide-react";
import { MainTab, PlayableItem, VodStream, SeriesItem, LiveStream } from "@/types/iptv";
import { getLiveStreamUrl } from "@/services/iptv";

interface SidebarProps {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  onOpenSettings: () => void;
  onOpenSamsungInstaller: () => void;
  onPlay: (playable: PlayableItem) => void;
  onSelectMedia: (item: VodStream | SeriesItem, type: "movie" | "series") => void;
  allMovies: VodStream[];
  allSeries: SeriesItem[];
  allLive: LiveStream[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  onOpenSettings,
  onOpenSamsungInstaller,
  onPlay,
  onSelectMedia,
  allMovies,
  allSeries,
  allLive,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const q = searchQuery.trim().toLowerCase();
  const searchResults =
    q.length >= 2
      ? {
          live: allLive.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 5),
          movies: allMovies
            .filter((m) => (m.title || m.name || "").toLowerCase().includes(q))
            .slice(0, 5),
          series: allSeries
            .filter((s) => (s.title || s.name || "").toLowerCase().includes(q))
            .slice(0, 5),
        }
      : null;

  const totalResultsCount = searchResults
    ? searchResults.live.length + searchResults.movies.length + searchResults.series.length
    : 0;

  const navItems: { id: MainTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: "home", label: "Início", icon: <Home className="w-5 h-5" /> },
    {
      id: "live",
      label: "TV ao Vivo",
      icon: <Tv className="w-5 h-5" />,
      badge: "AO VIVO",
    },
    { id: "movies", label: "Filmes", icon: <Film className="w-5 h-5" /> },
    { id: "series", label: "Séries", icon: <Video className="w-5 h-5" /> },
    { id: "favorites", label: "Minha Lista", icon: <Star className="w-5 h-5" /> },
  ];

  const handleNavClick = (tab: MainTab) => {
    onTabChange(tab);
    setIsMobileOpen(false);
  };

  const closeSearch = () => {
    setSearchQuery("");
  };

  return (
    <>
      {/* Mobile Top Header Bar with Hamburger */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 bg-[#07080c]/95 backdrop-blur-md border-b border-white/5 px-4 py-3.5 flex items-center justify-between">
        <button
          onClick={() => handleNavClick("home")}
          className="flex items-center gap-2 text-left"
        >
          <img
            src="/logo.png"
            alt="FULL TV STREAMS"
            className="h-9 w-auto max-h-9 object-contain drop-shadow"
          />
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSamsungInstaller}
            className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold"
            title="Instalar na TV Samsung"
          >
            TV App
          </button>
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-white/5 text-gray-300 hover:text-white border border-white/10"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 rounded-xl bg-white/5 text-gray-300 hover:text-white border border-white/10"
          >
            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Backdrop for mobile drawer */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 max-w-[80vw] bg-[#08090d]/98 backdrop-blur-2xl border-r border-white/5 flex flex-col justify-between transition-transform duration-300 ease-in-out p-4 sm:p-5 overflow-y-auto overflow-x-hidden select-none ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Top: Logo & Search */}
        <div className="space-y-6">
          {/* Brand Logo */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => handleNavClick("home")}
              className="flex items-center text-left group py-1"
            >
              <img
                src="/logo.png"
                alt="FULL TV STREAMS"
                className="h-12 w-auto max-w-[210px] object-contain drop-shadow-lg group-hover:scale-105 transition-transform"
              />
            </button>

            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1.5 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Bar in Sidebar */}
          <div className="relative">
            <div className="flex items-center bg-surface-light border border-white/10 focus-within:border-emerald-500/50 rounded-xl px-3.5 py-2.5 transition-all">
              <Search className="w-4 h-4 text-emerald-400 mr-2.5 flex-shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar títulos ou canais..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-white text-xs sm:text-sm focus:outline-none w-full placeholder-gray-500"
              />
              {searchQuery && (
                <button onClick={closeSearch} className="text-gray-400 hover:text-white p-0.5">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Instant Search Popup from Sidebar */}
            {q.length >= 2 && (
              <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 max-h-[60vh] overflow-y-auto bg-[#0d1017] border border-white/10 rounded-2xl p-4 shadow-2xl z-50 animate-fade-in">
                <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-white/10">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    {totalResultsCount} resultados
                  </span>
                  <button onClick={closeSearch} className="text-xs text-emerald-400">
                    Fechar
                  </button>
                </div>

                {totalResultsCount === 0 ? (
                  <div className="py-6 text-center text-gray-400 text-xs">
                    Nenhum título encontrado.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {searchResults?.live && searchResults.live.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                          TV ao Vivo
                        </span>
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
                              setIsMobileOpen(false);
                            }}
                            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/10 cursor-pointer text-xs text-gray-200"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                            <span className="truncate">{ch.name}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {searchResults?.movies && searchResults.movies.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                          Filmes
                        </span>
                        {searchResults.movies.map((m) => (
                          <div
                            key={m.stream_id}
                            onClick={() => {
                              onSelectMedia(m, "movie");
                              closeSearch();
                              setIsMobileOpen(false);
                            }}
                            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/10 cursor-pointer text-xs text-gray-200"
                          >
                            <Film className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{m.title || m.name}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {searchResults?.series && searchResults.series.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                          Séries
                        </span>
                        {searchResults.series.map((s) => (
                          <div
                            key={s.series_id}
                            onClick={() => {
                              onSelectMedia(s, "series");
                              closeSearch();
                              setIsMobileOpen(false);
                            }}
                            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/10 cursor-pointer text-xs text-gray-200"
                          >
                            <Video className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{s.title || s.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 px-3 block mb-2">
              Menu Principal
            </span>
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
                    isActive
                      ? "bg-emerald-500 text-black font-extrabold shadow-lg shadow-emerald-500/25"
                      : "text-gray-300 hover:text-white hover:bg-white/5 focus:bg-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? "text-black" : "text-emerald-400"}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>

                  {item.badge && !isActive && (
                    <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Samsung TV Installer & Settings */}
        <div className="space-y-2.5 pt-4 border-t border-white/5">
          {/* Samsung TV Installer Trigger Button */}
          <button
            onClick={() => {
              onOpenSamsungInstaller();
              setIsMobileOpen(false);
            }}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-500/20 via-emerald-500/10 to-transparent hover:from-emerald-500/30 border border-emerald-500/40 text-left transition-all group focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500 text-black shadow-md shadow-emerald-500/30">
                <Tv className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block group-hover:text-emerald-400 transition-colors">
                  Instalar na TV Samsung
                </span>
                <span className="text-[10px] text-emerald-400/90 font-medium">
                  Guia & Instalador Tizen
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-emerald-400" />
          </button>

          {/* Status info */}
          <div className="p-2.5 rounded-xl bg-surface-light border border-white/5 text-[11px] flex items-center justify-between">
            <span className="text-gray-400">Servidor</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Online
            </span>
          </div>

          {/* Settings */}
          <button
            onClick={() => {
              onOpenSettings();
              setIsMobileOpen(false);
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-colors text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-emerald-400" />
              <span>Configurações & Conta</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </aside>
    </>
  );
};
