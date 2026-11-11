"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  X,
  Tv,
  Film,
  SkipForward,
  Settings,
  RefreshCw,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { PlayableItem, LiveStream } from "@/types/iptv";
import { saveWatchProgress } from "@/services/storage";

interface VideoPlayerProps {
  item: PlayableItem | null;
  onClose: () => void;
  onPlayNext?: (next: PlayableItem) => void;
  liveChannels?: LiveStream[];
  onSwitchChannel?: (channel: LiveStream) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  item,
  onClose,
  onPlayNext,
  liveChannels = [],
  onSwitchChannel,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [aspectRatio, setAspectRatio] = useState<"contain" | "cover" | "fill">("contain");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showChannelsOverlay, setShowChannelsOverlay] = useState(false);
  const [channelSearch, setChannelSearch] = useState("");

  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null);

  // Activity timer to auto-hide controls
  const handleUserActivity = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimeout.current) clearTimeout(hideControlsTimeout.current);
    hideControlsTimeout.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3500);
  }, [isPlaying]);

  // Clean stream URL
  const streamUrl = item?.streamUrl || "";
  const isLive = item?.type === "live";

  // Setup HLS / Video playback
  useEffect(() => {
    if (!item || !streamUrl || !videoRef.current) return;

    const video = videoRef.current;
    setIsLoading(true);
    setErrorMsg(null);
    setCurrentTime(0);

    // Destroy existing HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isHls = streamUrl.includes(".m3u8") || isLive;

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
      });

      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        video.play().catch((e) => {
          console.warn("Autoplay was prevented, attempting muted play:", e);
          video.muted = true;
          setIsMuted(true);
          video.play().catch(console.error);
        });
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn("Fatal network error in HLS, trying recovery...", data);
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn("Fatal media error in HLS, recovering...", data);
              hls.recoverMediaError();
              break;
            default:
              console.error("Unrecoverable HLS error:", data);
              hls.destroy();
              setErrorMsg("Não foi possível carregar a transmissão. O servidor pode estar temporariamente indisponível.");
              setIsLoading(false);
              break;
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl") && isHls) {
      // Native Safari HLS
      video.src = streamUrl;
      video.addEventListener("loadedmetadata", () => {
        setIsLoading(false);
        video.play().catch(() => {
          video.muted = true;
          setIsMuted(true);
          video.play().catch(console.error);
        });
      });
    } else {
      // Direct MP4 / VOD stream
      video.src = streamUrl;
      video.load();
      video.play().catch(() => {
        video.muted = true;
        setIsMuted(true);
        video.play().catch(console.error);
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [item, streamUrl, isLive]);

  // Video event listeners (progress, time, duration)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setIsLoading(true);
    const onPlaying = () => setIsLoading(false);
    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
    };
    const onDurationChange = () => setDuration(video.duration || 0);
    const onError = () => {
      setIsLoading(false);
      setErrorMsg("Erro ao reproduzir o vídeo. Verifique sua conexão ou tente outro título.");
    };

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("durationchange", onDurationChange);
    video.addEventListener("error", onError);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("durationchange", onDurationChange);
      video.removeEventListener("error", onError);
    };
  }, []);

  // Save progress periodically for movies & episodes
  useEffect(() => {
    if (!item || isLive || duration <= 0 || currentTime <= 0) return;

    const interval = setInterval(() => {
      const progressPercent = Math.min(100, Math.round((currentTime / duration) * 100));
      saveWatchProgress({
        id: `${item.type}_${item.id}`,
        title: item.title,
        type: item.type as "movie" | "episode",
        currentTime,
        duration,
        progressPercent,
        poster: item.poster,
        timestamp: Date.now(),
        seriesId: (item as any).seriesId,
        seriesTitle: (item as any).seriesTitle,
        season: (item as any).season,
        episodeNum: (item as any).episodeNum,
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [item, isLive, currentTime, duration]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in channel search
      if (document.activeElement?.tagName === "INPUT") return;

      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        seek(10);
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        seek(-10);
      } else if (e.code === "ArrowUp") {
        e.preventDefault();
        changeVolume(Math.min(1, volume + 0.1));
      } else if (e.code === "ArrowDown") {
        e.preventDefault();
        changeVolume(Math.max(0, volume - 0.1));
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        toggleMute();
      } else if (e.key === "Escape") {
        if (isFullscreen) {
          document.exitFullscreen?.();
        } else {
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [volume, isFullscreen, isPlaying]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(console.error);
    } else {
      videoRef.current.pause();
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    videoRef.current.muted = newMuted;
    setIsMuted(newMuted);
    if (!newMuted && volume === 0) {
      setVolume(0.5);
      videoRef.current.volume = 0.5;
    }
  };

  const changeVolume = (val: number) => {
    if (!videoRef.current) return;
    const clamped = Math.max(0, Math.min(1, val));
    videoRef.current.volume = clamped;
    videoRef.current.muted = clamped === 0;
    setVolume(clamped);
    setIsMuted(clamped === 0);
  };

  const seek = (seconds: number) => {
    if (!videoRef.current || isLive) return;
    videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current || isLive) return;
    const target = parseFloat(e.target.value);
    videoRef.current.currentTime = target;
    setCurrentTime(target);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.error);
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.error);
    }
  };

  const cycleSpeed = () => {
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const newSpeed = speeds[nextIdx];
    setPlaybackSpeed(newSpeed);
    if (videoRef.current) videoRef.current.playbackRate = newSpeed;
  };

  const cycleAspect = () => {
    const aspects: ("contain" | "cover" | "fill")[] = ["contain", "cover", "fill"];
    const next = aspects[(aspects.indexOf(aspectRatio) + 1) % aspects.length];
    setAspectRatio(next);
  };

  const retryPlayback = () => {
    setErrorMsg(null);
    setIsLoading(true);
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(console.error);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "00:00";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
    }
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  if (!item) return null;

  const filteredChannels = liveChannels.filter((c) =>
    c.name.toLowerCase().includes(channelSearch.toLowerCase())
  );

  return (
    <div
      ref={containerRef}
      onMouseMove={handleUserActivity}
      onClick={handleUserActivity}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none overflow-hidden"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        onClick={togglePlay}
        playsInline
        className={`w-full h-full cursor-pointer ${
          aspectRatio === "contain"
            ? "object-contain"
            : aspectRatio === "cover"
            ? "object-cover"
            : "object-fill"
        }`}
      />

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-20">
          <div className="w-16 h-16 rounded-full border-4 border-white/20 border-t-red-600 animate-spin mb-4" />
          <p className="text-white text-sm font-semibold tracking-wide drop-shadow animate-pulse">
            Carregando transmissão...
          </p>
        </div>
      )}

      {/* Error State Overlay */}
      {errorMsg && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-6 z-30 text-center">
          <div className="w-16 h-16 rounded-full bg-red-600/20 text-red-500 flex items-center justify-center mb-4 border border-red-500/30">
            <X className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Erro na Reprodução</h3>
          <p className="text-gray-300 text-sm max-w-md mb-6">{errorMsg}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={retryPlayback}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-all shadow-lg shadow-red-600/40"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Tentar Novamente</span>
            </button>
            <a
              href={streamUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-all border border-white/10"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Abrir Link Direto</span>
            </a>
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold text-sm transition-all"
            >
              Fechar Player
            </button>
          </div>
        </div>
      )}

      {/* Unmute prompt if browser forced muted autoplay */}
      {isMuted && isPlaying && !errorMsg && (
        <button
          onClick={toggleMute}
          className="absolute top-20 right-6 z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-red-600 text-white font-semibold text-xs shadow-xl animate-bounce hover:bg-red-500 transition-all"
        >
          <VolumeX className="w-4 h-4" />
          <span>Clique para ativar o áudio</span>
        </button>
      )}

      {/* Top Header Controls Overlay */}
      <div
        className={`absolute top-0 inset-x-0 p-4 sm:p-6 bg-gradient-to-b from-black/90 via-black/40 to-transparent flex items-center justify-between z-30 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/10 hover:bg-red-600 text-white backdrop-blur-md border border-white/10 transition-all"
            title="Fechar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-sm sm:text-base md:text-lg drop-shadow">
                {item.title}
              </span>
              {isLive ? (
                <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-extrabold flex items-center gap-1 shadow-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  AO VIVO
                </span>
              ) : (
                item.type === "episode" && (
                  <span className="px-2 py-0.5 rounded-md bg-white/10 text-gray-300 text-xs font-semibold">
                    T{(item as any).season} : E{(item as any).episodeNum}
                  </span>
                )
              )}
            </div>
            {item.category && (
              <p className="text-xs text-gray-300 font-medium drop-shadow">{item.category}</p>
            )}
          </div>
        </div>

        {/* Live Channel Switcher Button */}
        {isLive && liveChannels.length > 0 && (
          <button
            onClick={() => setShowChannelsOverlay(!showChannelsOverlay)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs sm:text-sm backdrop-blur-md border border-white/10 transition-all"
          >
            <Tv className="w-4 h-4 text-red-500" />
            <span className="hidden sm:inline">Trocar Canal</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Slide-out Live Channels Drawer */}
      {showChannelsOverlay && isLive && (
        <div className="absolute top-0 right-0 bottom-0 w-80 sm:w-96 bg-black/95 backdrop-blur-xl border-l border-white/10 z-40 p-5 flex flex-col shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Tv className="w-5 h-5 text-red-500" />
              <h3 className="font-bold text-white text-base">Canais ao Vivo</h3>
            </div>
            <button
              onClick={() => setShowChannelsOverlay(false)}
              className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="my-3">
            <input
              type="text"
              placeholder="Buscar canal..."
              value={channelSearch}
              onChange={(e) => setChannelSearch(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-surface-light text-white text-xs placeholder-gray-500 border border-white/10 focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {filteredChannels.map((channel) => (
              <button
                key={channel.stream_id}
                onClick={() => {
                  onSwitchChannel?.(channel);
                  setShowChannelsOverlay(false);
                }}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left ${
                  channel.stream_id === item.id
                    ? "bg-red-600 text-white font-semibold shadow-md shadow-red-600/30"
                    : "hover:bg-white/10 text-gray-300 hover:text-white"
                }`}
              >
                {channel.stream_icon ? (
                  <img
                    src={channel.stream_icon}
                    alt={channel.name}
                    className="w-8 h-8 rounded-lg object-contain bg-black/50 p-1 flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center flex-shrink-0">
                    <Tv className="w-4 h-4 text-red-400" />
                  </div>
                )}
                <span className="text-xs line-clamp-1 flex-1">{channel.name}</span>
                {channel.stream_id === item.id && (
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Controls Bar Overlay */}
      <div
        className={`absolute bottom-0 inset-x-0 p-4 sm:p-6 bg-gradient-to-t from-black/95 via-black/60 to-transparent z-30 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Progress Seek Bar (VOD / Movies / Episodes) */}
        {!isLive && (
          <div className="relative mb-3 group/seek flex items-center">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.5}
              value={currentTime}
              onChange={handleSeekChange}
              className="w-full h-1.5 group-hover/seek:h-2.5 transition-all bg-white/20 rounded-full appearance-none relative z-10"
              style={{
                background: `linear-gradient(to right, #e50914 0%, #e50914 ${
                  duration > 0 ? (currentTime / duration) * 100 : 0
                }%, rgba(255,255,255,0.2) ${
                  duration > 0 ? (currentTime / duration) * 100 : 0
                }%, rgba(255,255,255,0.2) 100%)`,
              }}
            />
          </div>
        )}

        {/* Buttons Row */}
        <div className="flex items-center justify-between">
          {/* Left Controls: Play, Skip, Volume, Time */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={togglePlay}
              className="p-3 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/40 transition-all transform hover:scale-110 active:scale-95"
              title={isPlaying ? "Pausar (Espaço)" : "Reproduzir (Espaço)"}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
            </button>

            {!isLive && (
              <>
                <button
                  onClick={() => seek(-10)}
                  className="p-2 text-gray-300 hover:text-white transition-colors"
                  title="Voltar 10s"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
                <button
                  onClick={() => seek(10)}
                  className="p-2 text-gray-300 hover:text-white transition-colors"
                  title="Avançar 10s"
                >
                  <RotateCw className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Volume Control */}
            <div className="flex items-center gap-2 group/vol">
              <button
                onClick={toggleMute}
                className="p-2 text-gray-300 hover:text-white transition-colors"
                title={isMuted ? "Desmutar (M)" : "Mutar (M)"}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5 text-red-500" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={(e) => changeVolume(parseFloat(e.target.value))}
                className="w-16 sm:w-20 h-1 bg-white/30 rounded-full appearance-none transition-all"
                style={{
                  background: `linear-gradient(to right, #e50914 ${
                    isMuted ? 0 : volume * 100
                  }%, rgba(255,255,255,0.2) ${isMuted ? 0 : volume * 100}%)`,
                }}
              />
            </div>

            {/* Time Display */}
            <div className="text-xs font-medium text-gray-300 ml-1">
              {isLive ? (
                <div className="flex items-center gap-1.5 text-red-500 font-bold">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                  <span>TRANSMISSÃO AO VIVO</span>
                </div>
              ) : (
                <span>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              )}
            </div>
          </div>

          {/* Right Controls: Next Ep, Speed, Aspect, Fullscreen */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Next Episode (for Series) */}
            {(item as any).nextEpisode && onPlayNext && (
              <button
                onClick={() => onPlayNext((item as any).nextEpisode)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all border border-white/10"
                title="Próximo Episódio"
              >
                <SkipForward className="w-4 h-4" />
                <span className="hidden sm:inline">Próximo Ep</span>
              </button>
            )}

            {/* Speed Selector (VOD) */}
            {!isLive && (
              <button
                onClick={cycleSpeed}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/10"
                title="Velocidade de Reprodução"
              >
                {playbackSpeed}x
              </button>
            )}

            {/* Aspect Ratio */}
            <button
              onClick={cycleAspect}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all border border-white/10 hidden sm:block"
              title="Ajuste de Tela"
            >
              {aspectRatio === "contain" ? "Original" : aspectRatio === "cover" ? "Zoom" : "Esticar"}
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-2 text-gray-300 hover:text-white transition-colors"
              title={isFullscreen ? "Sair da tela cheia (F)" : "Tela cheia (F)"}
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
