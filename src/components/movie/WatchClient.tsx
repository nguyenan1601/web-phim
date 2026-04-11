"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import VideoPlayer from "./VideoPlayer";
import { updateHistoryAction } from "@/app/actions/history";
import { saveLocalHistory } from "@/lib/localHistory";
import { Play, Server } from "lucide-react";

interface Episode {
  name: string;
  slug: string;
  embed: string;
  m3u8: string;
}

interface EpisodeServer {
  server_name: string;
  items: Episode[];
}

interface WatchClientProps {
  m3u8: string;
  embedUrl?: string;
  poster: string;
  episodes: EpisodeServer[];
  filmSlug: string;
  filmName: string;
  currentEpSlug: string;
  currentServerIdx: number;
  initialTime?: number;
}

export default function WatchClient({
  m3u8,
  embedUrl,
  poster,
  episodes,
  filmSlug,
  filmName,
  currentEpSlug,
  currentServerIdx,
  initialTime = 0,
}: WatchClientProps) {
  const [activeServer, setActiveServer] = useState(currentServerIdx);

  const currentServer = episodes[Math.min(activeServer, episodes.length - 1)];
  const currentEp = currentServer.items.find((e) => e.slug === currentEpSlug) || currentServer.items[0];

  // Save watch history immediately when user opens the watch page
  useEffect(() => {
    const historyData = {
      movie_slug: filmSlug,
      movie_name: filmName,
      movie_thumb: poster,
      episode_slug: currentEpSlug,
      episode_name: currentEp.name,
      progress_seconds: initialTime || 0,
      total_seconds: 0,
    };
    updateHistoryAction(historyData);
    saveLocalHistory(historyData);
  }, [filmSlug, currentEpSlug]);

  const handleProgress = async (progress: { playedSeconds: number; totalSeconds: number }) => {
    // Chỉ lưu nếu đã xem ít nhất 5 giây
    if (progress.playedSeconds < 5) return;

    const historyData = {
      movie_slug: filmSlug,
      movie_name: filmName,
      movie_thumb: poster,
      episode_slug: currentEpSlug,
      episode_name: currentEp.name,
      progress_seconds: progress.playedSeconds,
      total_seconds: progress.totalSeconds,
    };

    updateHistoryAction(historyData);
    saveLocalHistory(historyData);
  };


  return (
    <div className="space-y-6">
      {/* Player */}
      <VideoPlayer 
        src={currentEp?.m3u8 || m3u8} 
        embedUrl={currentEp?.embed || embedUrl}
        poster={poster} 
        initialTime={activeServer === currentServerIdx ? initialTime : 0}
        onProgress={handleProgress}
      />

      {/* Server Selection */}
      {episodes.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {episodes.map((server, idx) => (
            <button
              key={idx}
              onClick={() => setActiveServer(idx)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                idx === activeServer
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                  : "bg-zinc-800/60 border border-white/5 text-zinc-400 hover:text-white hover:border-amber-500/30"
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              {server.server_name}
            </button>
          ))}
        </div>
      )}

      {/* Episode Grid */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <span className="w-1 h-6 bg-amber-500 rounded-full" />
          Chọn tập
        </h3>
        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-14 gap-2">
          {currentServer.items.map((ep) => {
            const isActive = ep.slug === currentEpSlug && activeServer === currentServerIdx;
            return (
              <Link
                key={ep.slug}
                href={`/xem/${filmSlug}?tap=${ep.slug}&sv=${activeServer}`}
                className={`flex items-center justify-center gap-1 px-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-amber-500 text-black shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/50"
                    : "bg-zinc-800/60 border border-white/5 text-zinc-300 hover:bg-amber-500 hover:text-black hover:border-amber-500"
                }`}
              >
                {isActive && <Play className="w-3 h-3" />}
                {ep.name}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
