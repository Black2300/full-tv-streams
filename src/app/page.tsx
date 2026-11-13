"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Tv,
  Film,
  Video,
  Play,
  Flame,
  Radio,
  Star,
  Sparkles,
  Clapperboard,
  History,
} from "lucide-react";
import {
  Category,
  LiveStream,
  VodStream,
  SeriesItem,
  PlayableItem,
  MainTab,
  WatchProgress,
} from "@/types/iptv";
import {
  fetchLiveCategories,
  fetchVodCategories,
  fetchSeriesCategories,
  fetchLiveStreams,
  fetchVodStreams,
  fetchSeries,
  getMovieStreamUrl,
  getEpisodeStreamUrl,
  getLiveStreamUrl,
  sortMediaByRecent,
} from "@/services/iptv";
import { getWatchHistory } from "@/services/storage";
import { Sidebar } from "@/components/Sidebar";
import { HeroBanner } from "@/components/HeroBanner";
import { ContentRow } from "@/components/ContentRow";
import { VideoPlayer } from "@/components/VideoPlayer";
import { MediaDetailView } from "@/components/MediaDetailView";
import { LiveTvView } from "@/components/LiveTvView";
import { MoviesView } from "@/components/MoviesView";
import { SeriesView } from "@/components/SeriesView";
import { FavoritesView } from "@/components/FavoritesView";
import { SettingsModal } from "@/components/SettingsModal";
import { SamsungTvInstallerModal } from "@/components/SamsungTvInstallerModal";
import { useTvSpatialNavigation } from "@/hooks/useTvSpatialNavigation";

export default function Home() {
  useTvSpatialNavigation();
  const [activeTab, setActiveTab] = useState<MainTab>("home");
  const [activePlayable, setActivePlayable] = useState<PlayableItem | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<{
    item: VodStream | SeriesItem;
    type: "movie" | "series";
  } | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSamsungInstallerOpen, setIsSamsungInstallerOpen] = useState(false);

  // Categories
  const [liveCategories, setLiveCategories] = useState<Category[]>([]);
  const [vodCategories, setVodCategories] = useState<Category[]>([]);
  const [seriesCategories, setSeriesCategories] = useState<Category[]>([]);

  // Media data (limitado para ultra-leveza)
  const [featuredLive, setFeaturedLive] = useState<LiveStream[]>([]);
  const [actionMovies, setActionMovies] = useState<VodStream[]>([]);
  const [scifiMovies, setScifiMovies] = useState<VodStream[]>([]);
  const [disneyMovies, setDisneyMovies] = useState<VodStream[]>([]);
  const [hboSeries, setHboSeries] = useState<SeriesItem[]>([]);
  const [popularSeries, setPopularSeries] = useState<SeriesItem[]>([]);
  const [heroItems, setHeroItems] = useState<(VodStream | SeriesItem)[]>([]);

  // Catalog data for dedicated views
  const [allLiveChannels, setAllLiveChannels] = useState<LiveStream[]>([]);
  const [allMoviesList, setAllMoviesList] = useState<VodStream[]>([]);
  const [allSeriesList, setAllSeriesList] = useState<SeriesItem[]>([]);

  // Watch history
  const [watchHistory, setWatchHistory] = useState<WatchProgress[]>([]);

  // Loading states
  const [isLoadingHome, setIsLoadingHome] = useState(true);
  const [isLoadingLive, setIsLoadingLive] = useState(false);
  const [isLoadingMovies, setIsLoadingMovies] = useState(false);
  const [isLoadingSeries, setIsLoadingSeries] = useState(false);

  // Active category selection
  const [activeLiveCatId, setActiveLiveCatId] = useState<string>("");
  const [activeMovieCatId, setActiveMovieCatId] = useState<string>("");
  const [activeSeriesCatId, setActiveSeriesCatId] = useState<string>("");

  const loadHomeData = useCallback(async () => {
    setIsLoadingHome(true);
    try {
      const [liveCats, vodCats, seriesCats] = await Promise.all([
        fetchLiveCategories().catch(() => []),
        fetchVodCategories().catch(() => []),
        fetchSeriesCategories().catch(() => []),
      ]);

      setLiveCategories(liveCats);
      setVodCategories(vodCats);
      setSeriesCategories(seriesCats);

      const soccerOrTopLive =
        liveCats.find((c) => c.category_name.includes("JOGOS") || c.category_name.includes("Abertos")) ||
        liveCats[0];

      const actionCat =
        vodCats.find((c) => c.category_name.toLowerCase().includes("acao") || c.category_name.toLowerCase().includes("ação")) ||
        vodCats[0];

      const scifiCat =
        vodCats.find((c) => c.category_name.toLowerCase().includes("ficao") || c.category_name.toLowerCase().includes("ficção")) ||
        vodCats[1];

      const disneyCat =
        vodCats.find((c) => c.category_name.toLowerCase().includes("disney") || c.category_name.toLowerCase().includes("cinema")) ||
        vodCats[2];

      const hboCat =
        seriesCats.find((c) => c.category_name.toLowerCase().includes("hbo") || c.category_name.toLowerCase().includes("netflix")) ||
        seriesCats[0];

      const popularSeriesCat =
        seriesCats.find((c) => c.category_name.toLowerCase().includes("prime") || c.category_name.toLowerCase().includes("apple")) ||
        seriesCats[1];

      // Busca inicial com limites para não sobrecarregar a memória
      const [liveStreams, actionList, scifiList, disneyList, hboList, popSeriesList] =
        await Promise.all([
          soccerOrTopLive ? fetchLiveStreams(soccerOrTopLive.category_id).catch(() => []) : [],
          actionCat ? fetchVodStreams(actionCat.category_id).catch(() => []) : [],
          scifiCat ? fetchVodStreams(scifiCat.category_id).catch(() => []) : [],
          disneyCat ? fetchVodStreams(disneyCat.category_id).catch(() => []) : [],
          hboCat ? fetchSeries(hboCat.category_id).catch(() => []) : [],
          popularSeriesCat ? fetchSeries(popularSeriesCat.category_id).catch(() => []) : [],
        ]);

      const sortedAction = sortMediaByRecent(actionList);
      const sortedScifi = sortMediaByRecent(scifiList);
      const sortedDisney = sortMediaByRecent(disneyList);
      const sortedHbo = sortMediaByRecent(hboList);
      const sortedPopSeries = sortMediaByRecent(popSeriesList);

      // Apenas 12 itens por linha na Home para máxima performance na TV (2026/2025 no topo)
      setFeaturedLive(liveStreams.slice(0, 12));
      setAllLiveChannels(liveStreams);
      setActionMovies(sortedAction.slice(0, 12));
      setScifiMovies(sortedScifi.slice(0, 12));
      setDisneyMovies(sortedDisney.slice(0, 12));
      setHboSeries(sortedHbo.slice(0, 12));
      setPopularSeries(sortedPopSeries.slice(0, 12));

      const combinedForHero: (VodStream | SeriesItem)[] = [
        ...sortedAction.slice(0, 4),
        ...sortedHbo.slice(0, 3),
        ...sortedScifi.slice(0, 3),
      ];
      setHeroItems(combinedForHero);

      setAllMoviesList(sortedAction);
      setAllSeriesList(sortedHbo);
    } catch (err) {
      console.error("Error loading home data:", err);
    } finally {
      setIsLoadingHome(false);
    }
  }, []);

  useEffect(() => {
    loadHomeData();
    setWatchHistory(getWatchHistory());
  }, [loadHomeData]);

  const handleSelectLiveCategory = async (catId: string) => {
    setActiveLiveCatId(catId);
    setIsLoadingLive(true);
    try {
      const data = await fetchLiveStreams(catId === "all" ? undefined : catId);
      setAllLiveChannels(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingLive(false);
    }
  };

  const handleSelectMovieCategory = async (catId: string) => {
    setActiveMovieCatId(catId);
    setIsLoadingMovies(true);
    try {
      const data = await fetchVodStreams(catId === "all" ? undefined : catId);
      setAllMoviesList(sortMediaByRecent(data));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingMovies(false);
    }
  };

  const handleSelectSeriesCategory = async (catId: string) => {
    setActiveSeriesCatId(catId);
    setIsLoadingSeries(true);
    try {
      const data = await fetchSeries(catId === "all" ? undefined : catId);
      setAllSeriesList(sortMediaByRecent(data));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingSeries(false);
    }
  };

  const handleTabChange = (tab: MainTab) => {
    setActiveTab(tab);
    setSelectedMedia(null);
    window.scrollTo({ top: 0, behavior: "smooth" });

    if (tab === "live" && allLiveChannels.length <= 1) {
      handleSelectLiveCategory("all");
    } else if (tab === "movies" && allMoviesList.length <= 1) {
      handleSelectMovieCategory("all");
    } else if (tab === "series" && allSeriesList.length <= 1) {
      handleSelectSeriesCategory("all");
    } else if (tab === "favorites") {
      setWatchHistory(getWatchHistory());
    }
  };

  const handlePlayMedia = (playable: PlayableItem) => {
    setActivePlayable(playable);
  };

  const handleOpenDetail = (item: VodStream | SeriesItem, type: "movie" | "series") => {
    setSelectedMedia({ item, type });
  };

  const handleResumeHistory = (progress: WatchProgress) => {
    if (progress.type === "live") {
      const cleanId = progress.id.replace("live_", "");
      setActivePlayable({
        type: "live",
        id: Number(cleanId),
        title: progress.title,
        poster: progress.poster,
        streamUrl: getLiveStreamUrl(cleanId),
      });
    } else if (progress.type === "movie") {
      const cleanId = progress.id.replace("movie_", "");
      setActivePlayable({
        type: "movie",
        id: Number(cleanId),
        title: progress.title,
        poster: progress.poster,
        streamUrl: getMovieStreamUrl(cleanId),
        initialTime: progress.currentTime || 0,
      });
    } else {
      const cleanId = progress.id.replace("episode_", "");
      setActivePlayable({
        type: "episode",
        id: cleanId,
        seriesId: progress.seriesId || 0,
        seriesTitle: progress.seriesTitle || progress.title,
        title: progress.title,
        season: progress.season || 1,
        episodeNum: progress.episodeNum || 1,
        poster: progress.poster,
        streamUrl: getEpisodeStreamUrl(cleanId),
        initialTime: progress.currentTime || 0,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#07080c] text-foreground flex flex-col selection:bg-emerald-500 selection:text-black">
      {/* Sidebar (Desktop fixo à esquerda / Mobile menu drawer) */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSamsungInstaller={() => setIsSamsungInstallerOpen(true)}
        onPlay={handlePlayMedia}
        onSelectMedia={handleOpenDetail}
        allMovies={allMoviesList}
        allSeries={allSeriesList}
        allLive={allLiveChannels}
      />

      {/* Main Content Body */}
      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen pt-14 lg:pt-0">
        <main className="flex-1">
          {/* Se um filme ou série for selecionado, abre a página de detalhes completa ao lado da sidebar (sem modal) */}
          {selectedMedia ? (
            <MediaDetailView
              item={selectedMedia.item}
              type={selectedMedia.type}
              onBack={() => setSelectedMedia(null)}
              onPlay={handlePlayMedia}
            />
          ) : (
            <>
              {/* ================= HOME TAB ================= */}
              {activeTab === "home" && (
            <div className="animate-fade-in pb-12">
              {/* Cinematic Hero Showcase */}
              {heroItems.length > 0 && (
                <HeroBanner
                  items={heroItems}
                  onPlay={handlePlayMedia}
                  onSelect={(item, t) => handleOpenDetail(item, t)}
                />
              )}

              {/* Continue Watching Row */}
              {watchHistory.length > 0 && (
                <div className="my-6 px-4 sm:px-8 lg:px-12 max-w-[1600px] mx-auto">
                  <div className="flex items-center gap-2 mb-3">
                    <History className="w-5 h-5 text-emerald-400" />
                    <h2 className="text-lg sm:text-xl font-bold text-white">Continuar Assistindo</h2>
                  </div>
                  <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
                    {watchHistory.slice(0, 10).map((prog) => (
                      <button
                        key={prog.id}
                        type="button"
                        tabIndex={0}
                        onClick={() => handleResumeHistory(prog)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.keyCode === 13) {
                            e.preventDefault();
                            handleResumeHistory(prog);
                          }
                        }}
                        onFocus={(e) =>
                          e.currentTarget.scrollIntoView({
                            behavior: "smooth",
                            block: "nearest",
                            inline: "center",
                          })
                        }
                        className="group flex-shrink-0 w-60 sm:w-68 bg-surface rounded-2xl overflow-hidden border border-white/5 hover:border-emerald-500/40 focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-400 focus:scale-[1.04] cursor-pointer transition-all duration-200 text-left select-none"
                      >
                        <div className="relative aspect-video bg-black/60 overflow-hidden pointer-events-none">
                          {prog.poster ? (
                            <img
                              src={prog.poster}
                              alt={prog.title}
                              className="w-full h-full object-cover group-hover:scale-105 group-focus:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                              <Clapperboard className="w-8 h-8" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 group-focus:bg-black/10 flex items-center justify-center transition-all">
                            <div className="p-3 rounded-full bg-emerald-500 text-black shadow-lg shadow-emerald-500/30 group-hover:scale-110 group-focus:scale-110 transition-transform">
                              <Play className="w-4 h-4 fill-black text-black" />
                            </div>
                          </div>

                          <div className="absolute bottom-0 inset-x-0 h-1.5 bg-white/20">
                            <div
                              className="h-full bg-emerald-500"
                              style={{ width: `${prog.progressPercent || 20}%` }}
                            />
                          </div>
                        </div>
                        <div className="p-3 pointer-events-none">
                          <h4 className="text-xs sm:text-sm font-semibold text-white truncate group-hover:text-emerald-400 group-focus:text-emerald-400 transition-colors">
                            {prog.title}
                          </h4>
                          <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1">
                            <span>
                              {prog.type === "live"
                                ? "Canal ao Vivo"
                                : prog.type === "movie"
                                ? "Filme"
                                : `T${prog.season}:E${prog.episodeNum}`}
                            </span>
                            <span className="text-emerald-400 font-semibold">
                              Continuar ({Math.round(prog.progressPercent || 0)}%)
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Channels Row (12 canais leves) */}
              {featuredLive.length > 0 && (
                <ContentRow
                  title="Canais em Destaque & Jogos do Dia"
                  subtitle="Transmissões ao vivo agora no navegador"
                  badge="AO VIVO"
                  icon={<Radio className="w-5 h-5 animate-pulse text-emerald-400" />}
                  items={featuredLive}
                  type="live"
                  categoryName="TV ao Vivo"
                  onPlay={handlePlayMedia}
                  onViewAll={() => handleTabChange("live")}
                />
              )}

              {/* Action Movies */}
              {actionMovies.length > 0 && (
                <ContentRow
                  title="Filmes de Ação & Adrenalina"
                  subtitle="Grandes produções e sucessos de bilheteria"
                  icon={<Flame className="w-5 h-5 text-emerald-400" />}
                  items={actionMovies}
                  type="movie"
                  categoryName="Ação"
                  onPlay={handlePlayMedia}
                  onSelect={(item, t) => handleOpenDetail(item as VodStream, t as "movie")}
                  onViewAll={() => handleTabChange("movies")}
                />
              )}

              {/* HBO Series */}
              {hboSeries.length > 0 && (
                <ContentRow
                  title="Séries Mais Assistidas"
                  subtitle="Temporadas completas prontas para maratonar"
                  icon={<Sparkles className="w-5 h-5 text-emerald-400" />}
                  items={hboSeries}
                  type="series"
                  categoryName="Séries"
                  onPlay={handlePlayMedia}
                  onSelect={(item, t) => handleOpenDetail(item as SeriesItem, t as "series")}
                  onViewAll={() => handleTabChange("series")}
                />
              )}

              {/* Sci-Fi Movies */}
              {scifiMovies.length > 0 && (
                <ContentRow
                  title="Ficção Científica & Espaço"
                  subtitle="Viagens no tempo, espaço e mundos distantes"
                  icon={<Film className="w-5 h-5 text-emerald-400" />}
                  items={scifiMovies}
                  type="movie"
                  categoryName="Ficção Científica"
                  onPlay={handlePlayMedia}
                  onSelect={(item, t) => handleOpenDetail(item as VodStream, t as "movie")}
                  onViewAll={() => handleTabChange("movies")}
                />
              )}

              {/* Disney & Family */}
              {disneyMovies.length > 0 && (
                <ContentRow
                  title="Disney, Cinema & Família"
                  subtitle="Para toda a família curtir junta"
                  icon={<Star className="w-5 h-5 text-emerald-400" />}
                  items={disneyMovies}
                  type="movie"
                  categoryName="Família"
                  onPlay={handlePlayMedia}
                  onSelect={(item, t) => handleOpenDetail(item as VodStream, t as "movie")}
                  onViewAll={() => handleTabChange("movies")}
                />
              )}

              {/* Popular Series */}
              {popularSeries.length > 0 && (
                <ContentRow
                  title="Séries em Alta & Lançamentos"
                  subtitle="As produções mais comentadas do momento"
                  icon={<Video className="w-5 h-5 text-emerald-400" />}
                  items={popularSeries}
                  type="series"
                  categoryName="Séries"
                  onPlay={handlePlayMedia}
                  onSelect={(item, t) => handleOpenDetail(item as SeriesItem, t as "series")}
                  onViewAll={() => handleTabChange("series")}
                />
              )}
            </div>
          )}

          {/* ================= LIVE TV TAB ================= */}
          {activeTab === "live" && (
            <LiveTvView
              categories={liveCategories}
              channels={allLiveChannels}
              onPlay={handlePlayMedia}
              activeCategoryId={activeLiveCatId}
              onSelectCategory={handleSelectLiveCategory}
              isLoading={isLoadingLive}
            />
          )}

          {/* ================= MOVIES TAB ================= */}
          {activeTab === "movies" && (
            <MoviesView
              categories={vodCategories}
              movies={allMoviesList}
              onPlay={handlePlayMedia}
              onSelect={(m) => handleOpenDetail(m, "movie")}
              activeCategoryId={activeMovieCatId}
              onSelectCategory={handleSelectMovieCategory}
              isLoading={isLoadingMovies}
            />
          )}

          {/* ================= SERIES TAB ================= */}
          {activeTab === "series" && (
            <SeriesView
              categories={seriesCategories}
              series={allSeriesList}
              onSelect={(s) => handleOpenDetail(s, "series")}
              activeCategoryId={activeSeriesCatId}
              onSelectCategory={handleSelectSeriesCategory}
              isLoading={isLoadingSeries}
            />
          )}

          {/* ================= FAVORITES TAB ================= */}
          {activeTab === "favorites" && (
            <FavoritesView
              onPlay={handlePlayMedia}
              onSelectMedia={handleOpenDetail}
            />
          )}
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-auto border-t border-white/5 bg-[#07080c] py-8 px-4 sm:px-8 text-xs text-gray-500">
          <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Full TV Streams"
                className="h-7 w-auto object-contain opacity-85 hover:opacity-100 transition-opacity"
              />
              <span className="text-gray-600">•</span>
              <span>4K Ultra HD</span>
            </div>

            <div className="flex items-center gap-4 text-gray-400">
              <button onClick={() => setIsSamsungInstallerOpen(true)} className="text-emerald-400 hover:text-emerald-300 transition-colors font-semibold">
                Instalar na TV Samsung
              </button>
              <button onClick={() => handleTabChange("live")} className="hover:text-emerald-400 transition-colors">
                TV ao Vivo
              </button>
              <button onClick={() => handleTabChange("movies")} className="hover:text-emerald-400 transition-colors">
                Filmes
              </button>
              <button onClick={() => handleTabChange("series")} className="hover:text-emerald-400 transition-colors">
                Séries
              </button>
              <button onClick={() => setIsSettingsOpen(true)} className="hover:text-emerald-400 transition-colors">
                Configurações
              </button>
            </div>

            <p className="text-[11px] text-gray-600">
              Hospedado na Vercel • HLS.js • HTML5 Video
            </p>
          </div>
        </footer>
      </div>

      {/* Video Player Fullscreen */}
      {activePlayable && (
        <VideoPlayer
          item={activePlayable}
          onClose={() => setActivePlayable(null)}
          onPlayNext={(next) => setActivePlayable(next)}
          liveChannels={(activePlayable as any).channelList || allLiveChannels}
          onSwitchChannel={(ch) => {
            setActivePlayable((prev) => ({
              ...prev,
              type: "live",
              id: ch.stream_id,
              title: ch.name,
              poster: ch.stream_icon,
              streamUrl: getLiveStreamUrl(ch.stream_id),
              channelList: (prev as any)?.channelList || allLiveChannels,
            }));
          }}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onReload={loadHomeData}
      />

      {/* Samsung Smart TV Installer Modal */}
      <SamsungTvInstallerModal
        isOpen={isSamsungInstallerOpen}
        onClose={() => setIsSamsungInstallerOpen(false)}
      />
    </div>
  );
}
