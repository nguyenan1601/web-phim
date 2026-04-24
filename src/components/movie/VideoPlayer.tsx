"use client";

import { useRef, useState, useEffect } from "react";
import { Maximize, Minimize, AlertTriangle } from "lucide-react";

interface VideoPlayerProps {
  embedUrl?: string;
  poster?: string;
  // Giữ lại các props cũ để tránh lỗi compile ở các component cha
  src?: string;
  initialTime?: number;
  onProgress?: (progress: { playedSeconds: number; totalSeconds: number }) => void;
}

export default function VideoPlayer({ embedUrl, poster }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  if (!embedUrl) {
    return (
      <div
        ref={containerRef}
        className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-white/5 shadow-2xl shadow-black/50"
      >
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-20">
          <div className="flex flex-col items-center gap-4 text-red-400 text-center px-6">
            <AlertTriangle className="w-10 h-10" />
            <span className="text-sm font-medium">Không có nguồn Embed hợp lệ.</span>
          </div>
        </div>
      </div>
    );
  }

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
        referrerPolicy="no-referrer"
      />

      {/* Fullscreen Button */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-3 right-3 p-2 rounded-lg bg-black/50 backdrop-blur-sm text-white/70 hover:text-amber-400 opacity-0 group-hover:opacity-100 transition-all z-30"
        title="Toàn màn hình"
      >
        {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
      </button>

      {/* Note for User: SAMEORIGIN block warning */}
      <div className="absolute bottom-2 left-2 pointer-events-none">
        <p className="text-[10px] text-white/20">Using Embed Player</p>
      </div>
    </div>
  );
}
