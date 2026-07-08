"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import VideoPlayer from "./VideoPlayer";
import { updateHistoryAction } from "@/app/actions/history";
import { saveLocalHistory } from "@/lib/localHistory";
import { ChevronDown, Globe, Play, Server } from "lucide-react";

interface Episode {
  name: string;
  slug: string;
  embed: string;
  m3u8: string;
}

interface EpisodeServer {
  server_name: string;
  items: Episode[];
  source?: string;
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

const PROVIDER_LABELS: Record<string, string> = {
  kkphim: "KKPhim",
  nguonc: "NguonC",
  phimmoi: "PhimMoi",
};

function getServerSource(server: EpisodeServer) {
  return server.source || "kkphim";
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
  const [activeSource, setActiveSource] = useState(() =>
    getServerSource(episodes[Math.min(currentServerIdx, episodes.length - 1)] || episodes[0])
  );

  const providerOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const server of episodes) {
      const source = getServerSource(server);
      counts.set(source, (counts.get(source) || 0) + 1);
    }

    return Array.from(counts.entries()).map(([source, count]) => ({
      source,
      count,
      label: PROVIDER_LABELS[source] || source,
    }));
  }, [episodes]);

  const filteredServers = useMemo(
    () =>
      episodes
        .map((server, index) => ({ server, index }))
        .filter(({ server }) => getServerSource(server) === activeSource),
    [activeSource, episodes]
  );

  const activeEntry =
    filteredServers.find(({ index }) => index === activeServer) ||
    filteredServers[0] ||
    { server: episodes[Math.min(activeServer, episodes.length - 1)], index: activeServer };
  const currentServer = activeEntry.server;
  const currentServerIndex = activeEntry.index;
  const uniqueEpisodes = currentServer.items.filter(
    (episode, index, items) => index === items.findIndex((item) => item.slug === episode.slug)
  );
  const currentEp = currentServer.items.find((e) => e.slug === currentEpSlug) || currentServer.items[0];
  const activeEpSlug = currentEp.slug;

  const handleProviderChange = (source: string) => {
    const firstServerIdx = episodes.findIndex((server) => getServerSource(server) === source);
    setActiveSource(source);
    setActiveServer(firstServerIdx >= 0 ? firstServerIdx : 0);
  };

  // Save watch history when user opens the watch page or episode changes
  useEffect(() => {
    const historyData = {
      movie_slug: filmSlug,
      movie_name: filmName,
      movie_thumb: poster,
      episode_slug: activeEpSlug,
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
  }, [activeEpSlug, currentEp.name, filmName, filmSlug, initialTime, poster, userId]);

  const saveProgress = async (playedSeconds: number, totalSeconds: number) => {
    if (playedSeconds < 5) return;

    const historyData = {
      movie_slug: filmSlug,
      movie_name: filmName,
      movie_thumb: poster,
      episode_slug: activeEpSlug,
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
          episode_slug: activeEpSlug,
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
  }, [activeEpSlug, currentEp.name, filmName, filmSlug, poster, userId]);

  return (
    <div className="space-y-6">
      {/* Player */}
      <VideoPlayer 
        src={currentEp?.m3u8 || m3u8} 
        embedUrl={currentEp?.embed || embedUrl}
        poster={poster} 
        initialTime={currentServerIndex === currentServerIdx && activeEpSlug === currentEpSlug ? initialTime : 0}
        onProgress={handleProgress}
      />

      <section className="space-y-5">
        <h2 className="text-2xl font-display font-semibold text-white flex items-center gap-3">
          <span className="w-1.5 h-8 bg-amber-500 rounded-full" />
          Danh Sách Tập Phim
        </h2>

      {providerOptions.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <label
            htmlFor="provider-source"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-300"
          >
            <Globe className="w-4 h-4 text-amber-400" />
            Nguồn phát
          </label>
          <div className="relative">
            <select
              id="provider-source"
              value={activeSource}
              disabled={providerOptions.length <= 1}
              onChange={(event) => handleProviderChange(event.target.value)}
              className="h-10 appearance-none rounded-lg border border-white/10 bg-zinc-900/80 pl-3 pr-9 text-sm font-medium text-white outline-none transition-colors hover:border-amber-500/30 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:cursor-not-allowed disabled:text-zinc-500 disabled:hover:border-white/10"
            >
              {providerOptions.map((provider) => (
                <option key={provider.source} value={provider.source}>
                  {provider.label} ({provider.count})
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          </div>
        </div>
      )}

      {/* Server Selection */}
      {filteredServers.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {filteredServers.map(({ server, index }) => (
            <button
              key={index}
              onClick={() => setActiveServer(index)}
              className={`inline-flex max-w-full items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                index === currentServerIndex
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
        <h3 className="sr-only">
          <span className="w-1 h-6 bg-amber-500 rounded-full" />
          Chọn tập
        </h3>
        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-14 gap-2">
          {uniqueEpisodes.map((ep, index) => {
            const isActive = ep.slug === activeEpSlug;
            return (
              <Link
                key={`${currentServerIndex}-${ep.slug}-${index}`}
                href={`/xem/${filmSlug}?tap=${ep.slug}&sv=${currentServerIndex}`}
                className={`min-w-0 truncate flex items-center justify-center gap-1 px-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
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
      </section>
    </div>
  );
}
