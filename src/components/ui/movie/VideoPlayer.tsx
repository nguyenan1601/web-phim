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
      <div className="relative w-full bg-black rounded-xl border border-white/5 shadow-2xl shadow-black/50" style={{ paddingBottom: "56.25%" }}>
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
    <div className="relative w-full bg-black rounded-xl border border-white/5 shadow-2xl shadow-black/50" style={{ paddingBottom: "56.25%" }}>
      <iframe
        src={embedUrl}
        className="absolute inset-0 w-full h-full rounded-xl"
        allowFullScreen
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
        style={{ border: "none" }}
        referrerPolicy="no-referrer"
      />

    </div>
  );
}
