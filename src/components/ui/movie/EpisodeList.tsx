"use client";

import Link from "next/link";
import { ChevronDown, Globe, Play, Server } from "lucide-react";
import { useState, useMemo } from "react";

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

interface EpisodeListProps {
  episodes: EpisodeServer[];
  filmSlug: string;
}

/** Labels hiển thị cho từng provider source */
const SOURCE_LABELS: Record<string, string> = {
  kkphim: "KKPhim",
  nguonc: "NguonC",
  phimmoi: "PhimMoi",
};

/** Màu sắc phân biệt cho từng source */
const SOURCE_COLORS: Record<string, string> = {
  kkphim: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  nguonc: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  phimmoi: "bg-sky-500/20 text-sky-400 border-sky-500/30",
};

function getServerSource(server: EpisodeServer) {
  return server.source || "kkphim";
}

export default function EpisodeList({ episodes, filmSlug }: EpisodeListProps) {
  const [activeServer, setActiveServer] = useState(0);
  const [activeSource, setActiveSource] = useState(
    () => episodes[0]?.source || "kkphim"
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
      label: SOURCE_LABELS[source] || source,
    }));
  }, [episodes]);

  const filteredServers = useMemo(() => {
    return episodes
      .map((server, index) => ({ server, index }))
      .filter(
        ({ server }) => getServerSource(server) === activeSource
      );
  }, [episodes, activeSource]);

  // Điều chỉnh activeServer nếu nó vượt quá filteredServers
  const safeActiveServer = Math.min(activeServer, filteredServers.length - 1);

  if (!episodes || episodes.length === 0) return null;

  const currentEntry = filteredServers[safeActiveServer];
  const currentServer = currentEntry?.server;
  const currentServerIndex = currentEntry?.index ?? 0;
  if (!currentServer) return null;

  const uniqueEpisodes = currentServer.items.filter(
    (episode, index, items) =>
      index === items.findIndex((item) => item.slug === episode.slug)
  );

  const handleProviderChange = (source: string) => {
    setActiveSource(source);
    setActiveServer(0);
  };

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-display font-semibold text-white flex items-center gap-3">
        <span className="w-1.5 h-8 bg-amber-500 rounded-full" />
        Danh Sách Tập Phim
      </h2>

      {providerOptions.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <label
            htmlFor="episode-provider-source"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-300"
          >
            <Globe className="h-4 w-4 text-amber-400" />
            Nguồn phát
          </label>
          <div className="relative">
            <select
              id="episode-provider-source"
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

      {/* Server Toggle — hiển thị badge source bên cạnh tên server */}
      {filteredServers.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {filteredServers.map(({ server, index }, idx) => {
            const source = getServerSource(server);
            const badgeColor =
              SOURCE_COLORS[source] || "bg-zinc-700/50 text-zinc-400";

            return (
              <button
                key={index}
                onClick={() => setActiveServer(idx)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  idx === safeActiveServer
                    ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                    : "bg-zinc-800/60 border border-white/5 text-zinc-400 hover:text-white hover:border-amber-500/30"
                }`}
              >
                <Server className="w-3.5 h-3.5" />
                {server.server_name}
                <span
                  className={`ml-1.5 px-1.5 py-0.5 text-[10px] rounded border ${badgeColor}`}
                >
                  {SOURCE_LABELS[source] || source}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Episode Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
        {uniqueEpisodes.map((ep, index) => (
          <Link
            key={`${currentServerIndex}-${ep.slug}-${index}`}
            href={`/xem/${filmSlug}?tap=${ep.slug}&sv=${currentServerIndex}`}
            className="group flex items-center justify-center gap-1 px-2 py-2.5 rounded-lg bg-zinc-800/60 border border-white/5 text-sm text-zinc-300 hover:bg-amber-500 hover:text-black hover:border-amber-500 hover:shadow-lg hover:shadow-amber-500/20 transition-all font-medium"
          >
            <Play className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            {ep.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
