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
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Shield,
  Zap,
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
  const activeChannelRef = useRef<HTMLButtonElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [aspectRatio, setAspectRatio] = useState<"contain" | "cover" | "fill">("contain");
  const [isLoading, setIsLoading] = useState(true);
  const [loadDuration, setLoadDuration] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showChannelsOverlay, setShowChannelsOverlay] = useState(false);
  const [channelSearch, setChannelSearch] = useState("");
  // Passa pelo stream-proxy que resolve o redirecionamento com User-Agent VLC e entrega o CDN direto
  const [useProxy, setUseProxy] = useState<boolean>(true);

  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null);
  const loadTimerRef = useRef<NodeJS.Timeout | null>(null);
  const retryCount = useRef(0);
  const isPlayingRef = useRef(false);
  isPlayingRef.current = isPlaying;

  // Foco automático no botão "Tentar Novamente" em caso de erro
  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => {
        const btn = document.querySelector<HTMLElement>('[data-tv-error-primary="true"]');
        if (btn) btn.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  // Temporizador para esconder os controles automaticamente na TV
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimeout.current) clearTimeout(hideControlsTimeout.current);
    hideControlsTimeout.current = setTimeout(() => {
      // Some com os controles quando o filme estiver rodando e a aba de canais não estiver aberta
      if (isPlayingRef.current && !showChannelsOverlay) {
        setShowControls(false);
      }
    }, 3500);
  }, [showChannelsOverlay]);

  // Quando inicia a reprodução, ativa o temporizador para sumir com os controles
  useEffect(() => {
    if (isPlaying) {
      resetControlsTimeout();
    } else {
      setShowControls(true);
      if (hideControlsTimeout.current) clearTimeout(hideControlsTimeout.current);
    }
  }, [isPlaying, resetControlsTimeout]);

  const rawUrl = item?.streamUrl || "";
  const isLive = item?.type === "live";

  // Auto-scroll to active channel when channel drawer opens
  useEffect(() => {
    if (showChannelsOverlay && activeChannelRef.current) {
      setTimeout(() => {
        activeChannelRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
      }, 100);
    }
  }, [showChannelsOverlay]);

  // Build the active URL (Direct or through stream-proxy)
  const currentStreamUrl = useProxy
    ? `/api/stream-proxy?url=${encodeURIComponent(rawUrl)}`
    : rawUrl;

  // Timer to track load duration and prevent infinite spinner
  useEffect(() => {
    if (!isLoading) {
      setLoadDuration(0);
      if (loadTimerRef.current) clearInterval(loadTimerRef.current);
      return;
    }

    setLoadDuration(0);
    loadTimerRef.current = setInterval(() => {
      setLoadDuration((prev) => {
        const next = prev + 1;
        if (next >= 14 && !isPlaying) {
          setErrorMsg(
            "O servidor IPTV demorou para responder. Tente alternar o modo de conexão ou selecione outro título."
          );
          setIsLoading(false);
        }
        return next;
      });
    }, 1000);

    return () => {
      if (loadTimerRef.current) clearInterval(loadTimerRef.current);
    };
  }, [isLoading, isPlaying]);

  // Main playback initialization
  useEffect(() => {
    if (!item || !rawUrl || !videoRef.current) return;

    const video = videoRef.current;
    setIsLoading(true);
    setErrorMsg(null);
    setLoadDuration(0);

    // Clean up any existing HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isHls = rawUrl.includes(".m3u8") || isLive;

    // Helper for safe play (handles browser autoplay blocking without breaking sound)
    const safePlay = () => {
      if (!video) return;

      // Preserve user volume and mute preference
      video.muted = isMuted;
      video.volume = volume;

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsLoading(false);
            setIsPlaying(true);
          })
          .catch((err) => {
            // ONLY fallback to muted if the browser policy explicitly blocked sound
            if (err.name === "NotAllowedError") {
              console.warn("Autoplay with sound blocked by browser policy, attempting muted:", err);
              video.muted = true;
              setIsMuted(true);
              video
                .play()
                .then(() => {
                  setIsLoading(false);
                  setIsPlaying(true);
                })
                .catch((e) => {
                  console.error("Muted play also failed:", e);
                  setIsLoading(false);
                });
            } else {
              // For AbortError or loading buffer, do NOT force mute
              console.log("Play interrupted or pending buffer frame:", err.name);
            }
          });
      }
    };

    if (isHls && Hls.isSupported()) {
      // Ultra-fast channel zapping configuration:
      // Start playback as soon as the first fragment arrives without waiting for 30s buffer!
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        startFragPrefetch: true,
        maxBufferLength: 8,
        maxMaxBufferLength: 16,
        maxBufferSize: 8 * 1024 * 1024,
        liveSyncDurationCount: 1,
        liveMaxLatencyDurationCount: 3,
        startLevel: -1,
        fragLoadingTimeOut: 12000,
        manifestLoadingTimeOut: 10000,
        xhrSetup: (xhr, url) => {
          xhr.withCredentials = false;
        },
      });

      hlsRef.current = hls;
      hls.loadSource(currentStreamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        safePlay();
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        console.warn("HLS Event Error:", data);

        if (data.details === "manifestParsingError") {
          console.log("Manifest error, falling back to direct video element...");
          hls.destroy();
          hlsRef.current = null;
          video.src = currentStreamUrl;
          video.load();
          safePlay();
          return;
        }

        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          console.log("Recovering from media error...");
          hls.recoverMediaError();
          return;
        }

        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              if (retryCount.current < 2) {
                retryCount.current++;
                console.log("Network error, retrying HLS load...");
                hls.startLoad();
              } else if (!useProxy) {
                console.log("Switching to proxy mode...");
                setUseProxy(true);
              } else {
                setErrorMsg(
                  "Não foi possível carregar a transmissão. O servidor de origem pode estar temporariamente fora do ar."
                );
                setIsLoading(false);
              }
              break;
            default:
              hls.destroy();
              hlsRef.current = null;
              video.src = currentStreamUrl;
              video.load();
              safePlay();
              break;
          }
        }
      });
    } else if (isHls && video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native Safari / Tizen HLS support
      video.src = currentStreamUrl;
      video.load();
      video.addEventListener(
        "loadedmetadata",
        () => {
          setIsLoading(false);
          safePlay();
        },
        { once: true }
      );
      safePlay();
    } else {
      // Direct MP4 / Native video playback (Works for movies, series & Smart TVs)
      video.src = currentStreamUrl;
      video.load();
      video.addEventListener(
        "canplay",
        () => {
          setIsLoading(false);
          safePlay();
        },
        { once: true }
      );
      safePlay();
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [item, rawUrl, currentStreamUrl, useProxy, isLive]);

  // Video listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => {
      setIsPlaying(true);
      setIsLoading(false);
    };
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setIsLoading(true);
    const onPlaying = () => {
      setIsPlaying(true);
      setIsLoading(false);
    };
    const onCanPlay = () => {
      setIsLoading(false);
    };
    const onCanPlayThrough = () => {
      setIsLoading(false);
    };
    const onLoadedMetadata = () => {
      setIsLoading(false);
    };
    const onLoadedData = () => {
      setIsLoading(false);
    };
    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.currentTime > 0) {
        setIsLoading(false);
      }
    };
    const onDurationChange = () => setDuration(video.duration || 0);

    const onNativeError = () => {
      console.warn("Native video error event", video.error);
      // If direct mode had error and we haven't tried proxy, try proxy
      if (!useProxy) {
        console.log("Direct playback error, trying proxy mode...");
        setUseProxy(true);
      } else {
        setIsLoading(false);
        setErrorMsg("Erro ao reproduzir o vídeo. Verifique sua conexão ou tente outro título.");
      }
    };

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("canplaythrough", onCanPlayThrough);
    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("loadeddata", onLoadedData);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("durationchange", onDurationChange);
    video.addEventListener("error", onNativeError);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("canplaythrough", onCanPlayThrough);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("loadeddata", onLoadedData);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("durationchange", onDurationChange);
      video.removeEventListener("error", onNativeError);
    };
  }, [useProxy]);

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

  // Keyboard and TV remote shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Qualquer toque no controle remoto mostra os controles e agenda para sumir após 3.5s
      resetControlsTimeout();

      if (document.activeElement?.tagName === "INPUT") return;

      // Se houver tela de erro aberta, liberar as teclas para navegação e seleção dos botões de erro
      if (errorMsg) {
        if (
          e.key === "Escape" ||
          e.key === "Back" ||
          e.key === "GoBack" ||
          e.key === "Return" ||
          e.keyCode === 10009 ||
          e.keyCode === 27
        ) {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }
        return;
      }

      // Enter or Space: Play/Pause
      if (e.code === "Space" || e.key === "Enter") {
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
      } else if (
        e.key === "Escape" ||
        e.key === "Back" ||
        e.key === "GoBack" ||
        e.key === "Return" ||
        e.keyCode === 10009 ||
        e.keyCode === 27
      ) {
        e.preventDefault();
        e.stopPropagation();
        if (showChannelsOverlay) {
          setShowChannelsOverlay(false);
          return;
        }
        onClose();
      }
    };

    const handleTizenHardwareKey = (e: any) => {
      if (e.keyName === "back") {
        e.preventDefault();
        if (showChannelsOverlay) {
          setShowChannelsOverlay(false);
          return;
        }
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("tizenhwkey", handleTizenHardwareKey);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("tizenhwkey", handleTizenHardwareKey);
    };
  }, [volume, isFullscreen, isPlaying, showChannelsOverlay, onClose, resetControlsTimeout, errorMsg]);

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
    videoRef.current.currentTime = Math.max(
      0,
      Math.min(duration, videoRef.current.currentTime + seconds)
    );
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
      containerRef.current
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(console.error);
    } else {
      document
        .exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(console.error);
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

  const toggleProxyMode = () => {
    setUseProxy((prev) => !prev);
    setIsLoading(true);
    setErrorMsg(null);
  };

  const retryPlayback = () => {
    setErrorMsg(null);
    setIsLoading(true);
    retryCount.current = 0;
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
      onMouseMove={resetControlsTimeout}
      onClick={resetControlsTimeout}
      onTouchStart={resetControlsTimeout}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none overflow-hidden"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        onClick={togglePlay}
        playsInline
        preload="auto"
        className={`w-full h-full cursor-pointer ${
          aspectRatio === "contain"
            ? "object-contain"
            : aspectRatio === "cover"
            ? "object-cover"
            : "object-fill"
        }`}
      />

      {/* Loading Spinner Profissional (sem popup incômodo de 'Iniciar reprodução') */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-20 pointer-events-none select-none">
          <div className="w-14 h-14 rounded-full border-4 border-white/20 border-t-emerald-500 animate-spin mb-4 shadow-lg shadow-emerald-500/20" />
          <p className="text-white text-sm font-semibold tracking-wide drop-shadow animate-pulse">
            {isLive ? "Conectando ao canal..." : "Carregando filme..."}
          </p>
        </div>
      )}

      {/* Error Overlay */}
      {errorMsg && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 p-6 z-30 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/30">
            <X className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Erro na Reprodução</h3>
          <p className="text-gray-300 text-sm max-w-md mb-6">{errorMsg}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={retryPlayback}
              data-tv-error-primary="true"
              tabIndex={0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm transition-all shadow-lg shadow-emerald-500/30 focus:outline-none focus:ring-4 focus:ring-white focus:scale-105"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Tentar Novamente</span>
            </button>
            <button
              onClick={toggleProxyMode}
              tabIndex={0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-400 font-semibold text-sm transition-all border border-emerald-500/40 focus:outline-none focus:ring-4 focus:ring-emerald-400 focus:scale-105"
            >
              <Zap className="w-4 h-4" />
              <span>Alternar Modo ({useProxy ? "Direto" : "Proxy"})</span>
            </button>
            <a
              href={rawUrl}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-all border border-white/10 focus:outline-none focus:ring-4 focus:ring-emerald-400 focus:scale-105"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Abrir Link Direto</span>
            </a>
            <button
              onClick={onClose}
              tabIndex={0}
              className="px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold text-sm transition-all focus:outline-none focus:ring-4 focus:ring-emerald-400 focus:scale-105"
            >
              Fechar Player
            </button>
          </div>
        </div>
      )}

      {/* Unmute Prompt (some junto com os controles para não ficar na tela) */}
      {isMuted && isPlaying && !errorMsg && showControls && (
        <button
          onClick={toggleMute}
          className="absolute bottom-24 left-6 z-30 flex items-center gap-2 px-4 py-2.5 rounded-full bg-emerald-500 text-black font-bold text-xs shadow-2xl animate-bounce hover:bg-emerald-400 transition-all border-2 border-black/30 active:scale-95"
          title="Ativar Som"
        >
          <VolumeX className="w-4 h-4" />
          <span>Clique para ativar o áudio</span>
        </button>
      )}

      {/* Top Header Overlay */}
      <div
        className={`absolute top-0 inset-x-0 p-4 sm:p-6 lg:px-8 bg-gradient-to-b from-black/95 via-black/50 to-transparent flex items-center justify-between z-30 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-3.5">
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/10 hover:bg-emerald-500 hover:text-black text-white backdrop-blur-md border border-white/10 transition-all"
            title="Fechar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-white font-bold text-sm sm:text-base md:text-lg drop-shadow">
                {item.title}
              </span>
              {isLive ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-black text-[10px] font-black flex items-center gap-1 shadow-md shadow-emerald-500/25">
                  <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />
                  AO VIVO
                </span>
              ) : (
                item.type === "episode" && (
                  <span className="px-2 py-0.5 rounded-md bg-white/15 text-gray-200 text-xs font-semibold">
                    T{(item as any).season} : E{(item as any).episodeNum}
                  </span>
                )
              )}
            </div>
            {item.category && (
              <p className="text-xs text-gray-300 font-medium drop-shadow mt-0.5">
                {item.category}
              </p>
            )}
          </div>
        </div>

        {/* Action Controls in Header */}
        <div className="flex items-center gap-2">
          {/* Stream Mode Switcher (Proxy vs Direct) */}
          <button
            onClick={toggleProxyMode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-white/10 text-gray-300 hover:text-emerald-400 text-xs font-medium border border-white/10 transition-all"
            title="Alternar entre transmissão direta e proxy"
          >
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">{useProxy ? "Modo: Proxy" : "Modo: Direto"}</span>
          </button>

          {/* Live Channel Switcher Button */}
          {isLive && liveChannels.length > 0 && (
            <button
              onClick={() => setShowChannelsOverlay(!showChannelsOverlay)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold text-xs sm:text-sm backdrop-blur-md border transition-all ${
                showChannelsOverlay
                  ? "bg-emerald-500 text-black border-emerald-400 shadow-lg shadow-emerald-500/30"
                  : "bg-white/10 hover:bg-emerald-500/20 text-white border-white/10 hover:border-emerald-500/40"
              }`}
            >
              <Tv className="w-4 h-4" />
              <span>Trocar Canal</span>
              <ChevronRight
                className={`w-4 h-4 transition-transform duration-200 ${
                  showChannelsOverlay ? "rotate-90" : ""
                }`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Slide-out Live Channels Drawer (Aba ampla com espaçamento e sem fechar ao trocar) */}
      {showChannelsOverlay && isLive && (
        <>
          {/* Backdrop sutil clicável para fechar */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px] z-40 transition-opacity"
            onClick={() => setShowChannelsOverlay(false)}
          />

          <div className="absolute top-0 right-0 bottom-0 w-[320px] sm:w-[420px] md:w-[460px] bg-[#0a0d14]/98 backdrop-blur-2xl border-l border-emerald-500/20 z-50 p-5 sm:p-6 flex flex-col shadow-2xl animate-fade-in">
            {/* Header do Guia de Canais */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <Tv className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base sm:text-lg">Guia de Canais</h3>
                  <p className="text-xs text-gray-400">
                    {filteredChannels.length} canais disponíveis
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowChannelsOverlay(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-emerald-500 hover:text-black text-gray-300 font-bold text-xs transition-colors"
                title="Fechar Guia"
              >
                <span>Fechar</span>
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Barra de Pesquisa de Canais */}
            <div className="my-4 relative">
              <input
                type="text"
                placeholder="Buscar por nome ou número..."
                value={channelSearch}
                onChange={(e) => setChannelSearch(e.target.value)}
                className="w-full px-4 py-2.5 pr-8 rounded-xl bg-surface-light text-white text-xs sm:text-sm placeholder-gray-500 border border-white/10 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              {channelSearch && (
                <button
                  onClick={() => setChannelSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Lista Espaçosa de Canais */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1.5 custom-scrollbar">
              {filteredChannels.map((channel) => {
                const isCurrent = channel.stream_id === item.id;
                return (
                  <button
                    key={channel.stream_id}
                    ref={isCurrent ? activeChannelRef : null}
                    onClick={() => {
                      // Garante que o áudio não seja forçado ao mudo na troca
                      if (videoRef.current && !isMuted) {
                        videoRef.current.muted = false;
                      }
                      onSwitchChannel?.(channel);
                      // NÃO FECHA A ABA: Permanece aberta para o usuário continuar navegando!
                    }}
                    className={`w-full flex items-center gap-3.5 p-3 sm:p-3.5 rounded-2xl transition-all text-left group ${
                      isCurrent
                        ? "bg-emerald-500/15 border-2 border-emerald-500 shadow-lg shadow-emerald-500/20"
                        : "bg-white/[0.04] hover:bg-white/10 border border-white/5 hover:border-emerald-500/30"
                    }`}
                  >
                    {/* Logo do Canal */}
                    <div className="w-12 h-12 rounded-xl bg-black/60 border border-white/10 p-1 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {channel.stream_icon ? (
                        <img
                          src={channel.stream_icon}
                          alt={channel.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <Tv className="w-5 h-5 text-emerald-400" />
                      )}
                    </div>

                    {/* Informações do Canal */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-xs sm:text-sm font-semibold line-clamp-1 ${
                            isCurrent ? "text-emerald-300 font-bold" : "text-gray-200 group-hover:text-white"
                          }`}
                        >
                          {channel.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {isCurrent ? (
                          <span className="flex items-center gap-1.5 text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Reproduzindo Agora
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-500 font-mono">
                            Canal #{channel.num || channel.stream_id}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Bottom Controls Bar Overlay */}
      <div
        className={`absolute bottom-0 inset-x-0 p-4 sm:p-6 lg:px-8 pb-5 sm:pb-7 bg-gradient-to-t from-black/95 via-black/60 to-transparent z-30 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Progress Seek Bar */}
        {!isLive && (
          <div className="relative mb-3.5 group/seek flex items-center">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.5}
              value={currentTime}
              onChange={handleSeekChange}
              className="w-full h-1.5 group-hover/seek:h-2.5 transition-all bg-white/20 rounded-full appearance-none relative z-10"
              style={{
                background: `linear-gradient(to right, #10b981 0%, #10b981 ${
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
              className="p-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/30 transition-all transform hover:scale-110 active:scale-95"
              title={isPlaying ? "Pausar (Espaço)" : "Reproduzir (Espaço)"}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-black text-black" />
              ) : (
                <Play className="w-5 h-5 fill-black text-black" />
              )}
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
                  <VolumeX className="w-5 h-5 text-emerald-400" />
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
                  background: `linear-gradient(to right, #10b981 ${
                    isMuted ? 0 : volume * 100
                  }%, rgba(255,255,255,0.2) ${isMuted ? 0 : volume * 100}%)`,
                }}
              />
            </div>

            {/* Time Display */}
            <div className="text-xs font-medium text-gray-300 ml-1">
              {isLive ? (
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
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
            {(item as any).nextEpisode && onPlayNext && (
              <button
                onClick={() => onPlayNext((item as any).nextEpisode)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-emerald-500/20 text-white text-xs font-semibold transition-all border border-white/10 hover:border-emerald-500/40"
                title="Próximo Episódio"
              >
                <SkipForward className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Próximo Ep</span>
              </button>
            )}

            {!isLive && (
              <button
                onClick={cycleSpeed}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/10"
                title="Velocidade de Reprodução"
              >
                {playbackSpeed}x
              </button>
            )}

            <button
              onClick={cycleAspect}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all border border-white/10 hidden sm:block"
              title="Ajuste de Tela"
            >
              {aspectRatio === "contain"
                ? "Original"
                : aspectRatio === "cover"
                ? "Zoom"
                : "Esticar"}
            </button>

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
