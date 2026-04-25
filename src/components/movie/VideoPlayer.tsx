"use client";

import { AlertTriangle } from "lucide-react";

interface VideoPlayerProps {
  embedUrl?: string;
  poster?: string;
  // Giữ lại các props cũ để tránh lỗi compile ở các component cha
  src?: string;
  initialTime?: number;
  onProgress?: (progress: { playedSeconds: number; totalSeconds: number }) => void;
}

export default function VideoPlayer({ embedUrl }: VideoPlayerProps) {
  if (!embedUrl) {
    return (
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-white/5 shadow-2xl shadow-black/50">
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
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-white/5 shadow-2xl shadow-black/50">
      <iframe
        src={embedUrl}
        className="w-full h-full"
        allowFullScreen
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
        style={{ border: "none" }}
        referrerPolicy="no-referrer"
      />

      {/* Note for User: SAMEORIGIN block warning */}
      <div className="absolute bottom-2 left-2 pointer-events-none">
        <p className="text-[10px] text-white/20">Using Embed Player</p>
      </div>
    </div>
  );
}
