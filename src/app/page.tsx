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
  Shield,
  Layers,
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
  cleanCategoryName,
  getMovieStreamUrl,
  getEpisodeStreamUrl,
  getLiveStreamUrl,
} from "@/services/iptv";
import { getWatchHistory } from "@/services/storage";
import { Header } from "@/components/Header";
import { HeroBanner } from "@/components/HeroBanner";
import { ContentRow } from "@/components/ContentRow";
import { VideoPlayer } from "@/components/VideoPlayer";
import { MediaDetailModal } from "@/components/MediaDetailModal";
import { LiveTvView } from "@/components/LiveTvView";
import { MoviesView } from "@/components/MoviesView";
import { SeriesView } from "@/components/SeriesView";
import { FavoritesView } from "@/components/FavoritesView";
import { SettingsModal } from "@/components/SettingsModal";

export default function Home() {
  const [activeTab, setActiveTab] = useState<MainTab>("home");
  const [activePlayable, setActivePlayable] = useState<PlayableItem | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<{
    item: VodStream | SeriesItem;
    type: "movie" | "series";
  } | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Categories
  const [liveCategories, setLiveCategories] = useState<Category[]>([]);
  const [vodCategories, setVodCategories] = useState<Category[]>([]);
  const [seriesCategories, setSeriesCategories] = useState<Category[]>([]);

  // Media data
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

  // Active category selection for dedicated tabs
  const [activeLiveCatId, setActiveLiveCatId] = useState<string>("");
  const [activeMovieCatId, setActiveMovieCatId] = useState<string>("");
  const [activeSeriesCatId, setActiveSeriesCatId] = useState<string>("");

  // Load initial home page data
  const loadHomeData = useCallback(async () => {
    setIsLoadingHome(true);
    try {
      // 1. Fetch Categories
      const [liveCats, vodCats, seriesCats] = await Promise.all([
        fetchLiveCategories().catch(() => []),
        fetchVodCategories().catch(() => []),
        fetchSeriesCategories().catch(() => []),
      ]);

      setLiveCategories(liveCats);
      setVodCategories(vodCats);
      setSeriesCategories(seriesCats);

      // Find top categories
      const soccerOrTopLive = liveCats.find((c) =>
        c.category_name.includes("JOGOS") || c.category_name.includes("Abertos")
      ) || liveCats[0];

      const actionCat = vodCats.find((c) =>
        c.category_name.toLowerCase().includes("acao") || c.category_name.toLowerCase().includes("ação")
      ) || vodCats[0];

      const scifiCat = vodCats.find((c) =>
        c.category_name.toLowerCase().includes("ficao") || c.category_name.toLowerCase().includes("ficção")
      ) || vodCats[1];

      const disneyCat = vodCats.find((c) =>
        c.category_name.toLowerCase().includes("disney") || c.category_name.toLowerCase().includes("cinema")
      ) || vodCats[2];

      const hboCat = seriesCats.find((c) =>
        c.category_name.toLowerCase().includes("hbo") || c.category_name.toLowerCase().includes("netflix")
      ) || seriesCats[0];

      const popularSeriesCat = seriesCats.find((c) =>
        c.category_name.toLowerCase().includes("prime") || c.category_name.toLowerCase().includes("apple")
      ) || seriesCats[1];

      // 2. Fetch Initial Streams in parallel
      const [liveStreams, actionList, scifiList, disneyList, hboList, popSeriesList] =
        await Promise.all([
          soccerOrTopLive ? fetchLiveStreams(soccerOrTopLive.category_id).catch(() => []) : [],
          actionCat ? fetchVodStreams(actionCat.category_id).catch(() => []) : [],
          scifiCat ? fetchVodStreams(scifiCat.category_id).catch(() => []) : [],
          disneyCat ? fetchVodStreams(disneyCat.category_id).catch(() => []) : [],
          hboCat ? fetchSeries(hboCat.category_id).catch(() => []) : [],
          popularSeriesCat ? fetchSeries(popularSeriesCat.category_id).catch(() => []) : [],
        ]);

      setFeaturedLive(liveStreams);
      setAllLiveChannels(liveStreams);
      setActionMovies(actionList);
      setScifiMovies(scifiList);
      setDisneyMovies(disneyList);
      setHboSeries(hboList);
      setPopularSeries(popSeriesList);

      // Populate hero carousel with rich backdrops
      const combinedForHero: (VodStream | SeriesItem)[] = [
        ...actionList.slice(0, 4),
        ...hboList.slice(0, 3),
        ...scifiList.slice(0, 3),
      ];
      setHeroItems(combinedForHero);

      // Pre-seed search lists
      setAllMoviesList([...actionList, ...scifiList, ...disneyList]);
      setAllSeriesList([...hboList, ...popSeriesList]);
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

  // Load dedicated tab content on demand
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
      setAllMoviesList(data);
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
      setAllSeriesList(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingSeries(false);
    }
  };

  // Change tab and load first category if empty
  const handleTabChange = (tab: MainTab) => {
    setActiveTab(tab);
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
      });
    } else {
      // Episode
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
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-red-600 selection:text-white">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onPlay={handlePlayMedia}
        onSelectMedia={handleOpenDetail}
        allMovies={allMoviesList}
        allSeries={allSeriesList}
        allLive={allLiveChannels}
      />

      {/* Main Content Areas based on Active Tab */}
      <main className="flex-1">
        {/* ================= HOME TAB ================= */}
        {activeTab === "home" && (
          <div className="animate-fade-in">
            {/* Cinematic Hero Showcase Carousel */}
            {heroItems.length > 0 && (
              <HeroBanner
                items={heroItems}
                onPlay={handlePlayMedia}
                onSelect={(item, t) => handleOpenDetail(item, t)}
              />
            )}

            {/* Continue Watching Section */}
            {watchHistory.length > 0 && (
              <div className="my-6 px-4 sm:px-8 md:px-12 max-w-7xl mx-auto">
                <div className="flex items-center gap-2 mb-3">
                  <History className="w-5 h-5 text-red-500" />
                  <h2 className="text-lg sm:text-xl font-bold text-white">Continuar Assistindo</h2>
                </div>
                <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
                  {watchHistory.slice(0, 6).map((prog) => (
                    <div
                      key={prog.id}
                      onClick={() => handleResumeHistory(prog)}
                      className="group flex-shrink-0 w-56 sm:w-64 bg-surface rounded-xl overflow-hidden border border-white/5 hover:border-red-500/40 cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                    >
                      <div className="relative aspect-video bg-black/60 overflow-hidden">
                        {prog.poster ? (
                          <img
                            src={prog.poster}
                            alt={prog.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500">
                            <Clapperboard className="w-8 h-8" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 flex items-center justify-center transition-all">
                          <div className="p-3 rounded-full bg-red-600 text-white shadow-lg group-hover:scale-110 transition-transform">
                            <Play className="w-4 h-4 fill-white" />
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="absolute bottom-0 inset-x-0 h-1 bg-white/20">
                          <div
                            className="h-full bg-red-600"
                            style={{ width: `${prog.progressPercent || 20}%` }}
                          />
                        </div>
                      </div>
                      <div className="p-2.5">
                        <h4 className="text-xs sm:text-sm font-semibold text-white truncate">
                          {prog.title}
                        </h4>
                        <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1">
                          <span>{prog.type === "live" ? "Canal ao Vivo" : prog.type === "movie" ? "Filme" : `T${prog.season}:E${prog.episodeNum}`}</span>
                          <span className="text-red-400 font-medium">Continuar</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Live TV Channels Row */}
            {featuredLive.length > 0 && (
              <ContentRow
                title="Canais em Destaque & Jogos do Dia"
                subtitle="Transmissões ao vivo agora no navegador"
                badge="AO VIVO"
                icon={<Radio className="w-5 h-5 animate-pulse text-red-500" />}
                items={featuredLive}
                type="live"
                categoryName="TV ao Vivo"
                onPlay={handlePlayMedia}
                onViewAll={() => handleTabChange("live")}
              />
            )}

            {/* Action & Adventure Movies Row */}
            {actionMovies.length > 0 && (
              <ContentRow
                title="Filmes de Ação & Adrenalina"
                subtitle="Grandes produções e sucessos de bilheteria"
                icon={<Flame className="w-5 h-5 text-amber-500" />}
                items={actionMovies}
                type="movie"
                categoryName="Ação"
                onPlay={handlePlayMedia}
                onSelect={(item, t) => handleOpenDetail(item as VodStream, t as "movie")}
                onViewAll={() => handleTabChange("movies")}
              />
            )}

            {/* Popular HBO / Netflix Series Row */}
            {hboSeries.length > 0 && (
              <ContentRow
                title="Séries Mais Assistidas"
                subtitle="Temporadas completas prontas para maratonar"
                icon={<Sparkles className="w-5 h-5 text-indigo-400" />}
                items={hboSeries}
                type="series"
                categoryName="Séries"
                onPlay={handlePlayMedia}
                onSelect={(item, t) => handleOpenDetail(item as SeriesItem, t as "series")}
                onViewAll={() => handleTabChange("series")}
              />
            )}

            {/* Sci-Fi Movies Row */}
            {scifiMovies.length > 0 && (
              <ContentRow
                title="Ficção Científica & Futuro"
                subtitle="Viagens no tempo, espaço e mundos distantes"
                icon={<Film className="w-5 h-5 text-cyan-400" />}
                items={scifiMovies}
                type="movie"
                categoryName="Ficção Científica"
                onPlay={handlePlayMedia}
                onSelect={(item, t) => handleOpenDetail(item as VodStream, t as "movie")}
                onViewAll={() => handleTabChange("movies")}
              />
            )}

            {/* Disney & Family Movies Row */}
            {disneyMovies.length > 0 && (
              <ContentRow
                title="Disney, Cinema & Animações"
                subtitle="Para toda a família curtir junta"
                icon={<Star className="w-5 h-5 text-yellow-400" />}
                items={disneyMovies}
                type="movie"
                categoryName="Família"
                onPlay={handlePlayMedia}
                onSelect={(item, t) => handleOpenDetail(item as VodStream, t as "movie")}
                onViewAll={() => handleTabChange("movies")}
              />
            )}

            {/* Prime Video & Popular Series Row */}
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
      </main>

      {/* Video Player Modal / Overlay */}
      {activePlayable && (
        <VideoPlayer
          item={activePlayable}
          onClose={() => setActivePlayable(null)}
          onPlayNext={(next) => setActivePlayable(next)}
          liveChannels={allLiveChannels}
          onSwitchChannel={(ch) => {
            setActivePlayable({
              type: "live",
              id: ch.stream_id,
              title: ch.name,
              poster: ch.stream_icon,
              streamUrl: getLiveStreamUrl(ch.stream_id),
            });
          }}
        />
      )}

      {/* Movie / Series Details Modal */}
      {selectedMedia && (
        <MediaDetailModal
          item={selectedMedia.item}
          type={selectedMedia.type}
          onClose={() => setSelectedMedia(null)}
          onPlay={handlePlayMedia}
        />
      )}

      {/* Settings / Account Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onReload={loadHomeData}
      />

      {/* Footer */}
      <footer className="mt-20 border-t border-white/5 bg-[#090a0f] py-10 px-4 sm:px-8 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-red-600 flex items-center justify-center text-white font-bold text-xs">
              FT
            </div>
            <span className="font-bold text-gray-300">Full TV Streams</span>
            <span className="text-gray-600">|</span>
            <span>Player Web em Tempo Real</span>
          </div>

          <div className="flex items-center gap-4 text-gray-400">
            <button onClick={() => handleTabChange("live")} className="hover:text-white transition-colors">
              TV ao Vivo
            </button>
            <button onClick={() => handleTabChange("movies")} className="hover:text-white transition-colors">
              Filmes
            </button>
            <button onClick={() => handleTabChange("series")} className="hover:text-white transition-colors">
              Séries
            </button>
            <button onClick={() => setIsSettingsOpen(true)} className="hover:text-white transition-colors">
              Configurações
            </button>
          </div>

          <p className="text-[11px] text-gray-600">
            Otimizado para hospedagem na Vercel • HLS.js • HTML5 Video
          </p>
        </div>
      </footer>
    </div>
  );
}
