"use client";

import Link from "next/link";
import { Play, Server } from "lucide-react";
import { useState } from "react";

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

interface EpisodeListProps {
  episodes: EpisodeServer[];
  filmSlug: string;
}

export default function EpisodeList({ episodes, filmSlug }: EpisodeListProps) {
  const [activeServer, setActiveServer] = useState(0);

  if (!episodes || episodes.length === 0) return null;

  const currentServer = episodes[activeServer];
  const uniqueEpisodes = currentServer.items.filter(
    (episode, index, items) => index === items.findIndex((item) => item.slug === episode.slug)
  );

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-display font-semibold text-white flex items-center gap-3">
        <span className="w-1.5 h-8 bg-amber-500 rounded-full" />
        Danh Sách Tập Phim
      </h2>

      {/* Server Toggle */}
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
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
        {uniqueEpisodes.map((ep, index) => (
          <Link
            key={`${activeServer}-${ep.slug}-${index}`}
            href={`/xem/${filmSlug}?tap=${ep.slug}&sv=${activeServer}`}
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
