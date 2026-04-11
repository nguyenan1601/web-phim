"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { AlertTriangle, Loader2, Maximize, Minimize, MonitorPlay } from "lucide-react";

interface VideoPlayerProps {
  src: string;
  embedUrl?: string;
  poster?: string;
  initialTime?: number;
  onProgress?: (progress: { playedSeconds: number; totalSeconds: number }) => void;
}

export default function VideoPlayer({ src, embedUrl, poster, initialTime = 0, onProgress }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useEmbed, setUseEmbed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const lastUpdateRef = useRef<number>(0);
  const isInitialTimeSet = useRef(false);

  useEffect(() => {
    isInitialTimeSet.current = false;
    setUseEmbed(false);
    setError(null);
  }, [src]);

  const setInitialTime = () => {
    const video = videoRef.current;
    if (video && initialTime > 0 && !isInitialTimeSet.current) {
      video.currentTime = initialTime;
      isInitialTimeSet.current = true;
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !onProgress) return;

    const currentTime = video.currentTime;
    // Gửi update mỗi 5 giây để tránh quá tải
    if (Date.now() - lastUpdateRef.current > 5000) {
      onProgress({
        playedSeconds: Math.floor(currentTime),
        totalSeconds: Math.floor(video.duration || 0),
      });
      lastUpdateRef.current = Date.now();
    }
  };

  // Switch to embed mode
  const switchToEmbed = () => {
    if (embedUrl) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      setUseEmbed(true);
      setError(null);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Skip HLS setup if using embed
    if (useEmbed) return;

    const video = videoRef.current;
    if (!video || !src) return;

    setIsLoading(true);
    setError(null);

    const proxiedUrl = `/api/proxy-stream?url=${encodeURIComponent(src)}`;
    let recoveryCount = 0;

    // If HLS.js is supported
    if (Hls.isSupported()) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }

      const hls = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        startLevel: -1, // Auto quality
        xhrSetup: (xhr) => {
          xhr.withCredentials = false;
        },
      });
      
      hlsRef.current = hls;

      hls.loadSource(proxiedUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        setInitialTime();
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          if (recoveryCount < 2) {
            recoveryCount++;
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.warn("HLS Network Error, attempting recovery...");
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.warn("HLS Media Error, attempting recovery...");
                hls.recoverMediaError();
                break;
              default:
                // Auto-switch to embed if available
                if (embedUrl) {
                  console.warn("HLS Fatal Error, switching to embed player...");
                  switchToEmbed();
                } else {
                  setError("Không thể phát video này. Code: " + data.details);
                  setIsLoading(false);
                }
                break;
            }
          } else {
            // Max recovery reached, auto-switch to embed
            if (embedUrl) {
              console.warn("HLS max recovery reached, switching to embed player...");
              hls.destroy();
              switchToEmbed();
            } else {
              console.error("HLS Fatal Error - Max recovery tried:", data);
              setError("Gặp sự cố khi tải video. Vui lòng thử lại sau hoặc đổi server.");
              setIsLoading(false);
              hls.destroy();
            }
          }
        }
      });

      return () => {
        hls.destroy();
      };
    }
    // Native HLS support (Safari / iOS)
    else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = proxiedUrl;
      video.addEventListener("loadedmetadata", () => {
        setIsLoading(false);
        setInitialTime();
        video.play().catch(() => {});
      });
      video.addEventListener("error", () => {
        if (embedUrl) {
          switchToEmbed();
        } else {
          setError("Không thể tải video trên trình duyệt này.");
          setIsLoading(false);
        }
      });
    } else {
      // No HLS support at all, try embed
      if (embedUrl) {
        switchToEmbed();
      } else {
        setError("Trình duyệt không hỗ trợ phát video HLS.");
        setIsLoading(false);
      }
    }
  }, [src, useEmbed]);

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Embed mode: render iframe
  if (useEmbed && embedUrl) {
    return (
      <div
        ref={containerRef}
        className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-white/5 shadow-2xl shadow-black/50 group"
      >
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allowFullScreen
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          style={{ border: "none" }}
        />

        {/* Embed indicator */}
        <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-medium flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-30">
          <MonitorPlay className="w-3.5 h-3.5" />
          Server Embed
        </div>

        {/* Custom Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          className="absolute top-3 right-3 p-2 rounded-lg bg-black/50 backdrop-blur-sm text-white/70 hover:text-amber-400 opacity-0 group-hover:opacity-100 transition-all z-30"
        >
          {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-white/5 shadow-2xl shadow-black/50 group"
    >
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
          <div className="flex flex-col items-center gap-3 text-amber-400">
            <Loader2 className="w-10 h-10 animate-spin" />
            <span className="text-sm font-medium text-zinc-400">Đang tải video...</span>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-20">
          <div className="flex flex-col items-center gap-4 text-red-400 text-center px-6">
            <AlertTriangle className="w-10 h-10" />
            <span className="text-sm font-medium">{error}</span>
            {embedUrl && (
              <button
                onClick={switchToEmbed}
                className="px-5 py-2.5 bg-amber-500 text-black font-semibold rounded-xl hover:bg-amber-400 transition-all text-sm flex items-center gap-2"
              >
                <MonitorPlay className="w-4 h-4" />
                Chuyển sang Server Embed
              </button>
            )}
          </div>
        </div>
      )}

      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        playsInline
        poster={poster}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
      />

      {/* Custom Fullscreen Button */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-3 right-3 p-2 rounded-lg bg-black/50 backdrop-blur-sm text-white/70 hover:text-amber-400 opacity-0 group-hover:opacity-100 transition-all z-30"
      >
        {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
      </button>
    </div>
  );
}
