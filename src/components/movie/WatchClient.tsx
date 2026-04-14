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
  userId?: string;
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
  userId,
}: WatchClientProps) {
  const [activeServer, setActiveServer] = useState(currentServerIdx);

  const currentServer = episodes[Math.min(activeServer, episodes.length - 1)];
  const uniqueEpisodes = currentServer.items.filter(
    (episode, index, items) => index === items.findIndex((item) => item.slug === episode.slug)
  );
  const currentEp = currentServer.items.find((e) => e.slug === currentEpSlug) || currentServer.items[0];

  // Save watch history when user opens the watch page or episode changes
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

    // Save to localStorage regardless of login status (as local cache)
    saveLocalHistory(historyData);

    if (userId) {
      // Logged-in user: also save to DB
      updateHistoryAction(historyData);
    }
  }, [filmSlug, currentEpSlug]);

  const saveProgress = async (playedSeconds: number, totalSeconds: number) => {
    if (playedSeconds < 5) return;

    const historyData = {
      movie_slug: filmSlug,
      movie_name: filmName,
      movie_thumb: poster,
      episode_slug: currentEpSlug,
      episode_name: currentEp.name,
      progress_seconds: Math.floor(playedSeconds),
      total_seconds: Math.floor(totalSeconds),
    };

    // Always update local storage first (fast)
    saveLocalHistory(historyData);

    if (userId) {
      // Then sync to DB
      await updateHistoryAction(historyData);
    }
  };

  const handleProgress = (progress: { playedSeconds: number; totalSeconds: number }) => {
    saveProgress(progress.playedSeconds, progress.totalSeconds);
  };

  // Cố gắng lưu lần cuối khi đóng tab/chuyển trang
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Chúng ta không thể await trong beforeunload, 
      // nhưng saveLocalHistory là đồng bộ nên sẽ chạy được.
      // Database update có thể không kịp, nhưng updateHistoryAction dùng fetch/server action
      // có cơ hội chạy nếu trình duyệt chưa đóng hẳn.
      const video = document.querySelector('video');
      if (video && video.currentTime > 5) {
        const historyData = {
          movie_slug: filmSlug,
          movie_name: filmName,
          movie_thumb: poster,
          episode_slug: currentEpSlug,
          episode_name: currentEp.name,
          progress_seconds: Math.floor(video.currentTime),
          total_seconds: Math.floor(video.duration || 0),
        };
        saveLocalHistory(historyData);
        if (userId) {
          // Gửi request ngầm, không await
          updateHistoryAction(historyData);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [filmSlug, currentEpSlug, userId]);

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
          {uniqueEpisodes.map((ep, index) => {
            const isActive = ep.slug === currentEpSlug && activeServer === currentServerIdx;
            return (
              <Link
                key={`${activeServer}-${ep.slug}-${index}`}
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
