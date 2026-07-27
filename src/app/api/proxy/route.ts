import { NextRequest, NextResponse } from "next/server";

/**
 * API Proxy Route
 * 
 * Proxy requests đến API bên thứ 3 (phimapi.com, nguonc.com, etc.)
 * Dùng khi deploy không thể gọi trực tiếp API bên thứ 3 do CORS hoặc network restrictions.
 * 
 * Usage:
 *   GET /api/proxy?url=https://phimapi.com/phim/slug
 *   GET /api/proxy?url=https://phim.nguonc.com/api/film/slug
 * 
 * Environment:
 *   - ALLOWED_PROXY_HOSTS: Comma-separated list of allowed hosts (default: phimapi.com,phimimg.com,phim.nguonc.com)
 */

const DEFAULT_ALLOWED_HOSTS = [
  "phimapi.com",
  "phimimg.com", 
  "phim.nguonc.com",
  "ophim.live",
  "img.ophim.live",
];

function getAllowedHosts(): string[] {
  const envHosts = process.env.ALLOWED_PROXY_HOSTS;
  if (envHosts) {
    return envHosts.split(",").map((h) => h.trim().toLowerCase());
  }
  return DEFAULT_ALLOWED_HOSTS;
}

function isAllowedHost(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    const allowedHosts = getAllowedHosts();
    
    return allowedHosts.some((host) => {
      if (host.startsWith("*.")) {
        // Wildcard match: *.example.com matches sub.example.com
        const domain = host.slice(2);
        return hostname === domain || hostname.endsWith("." + domain);
      }
      return hostname === host;
    });
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "Missing url parameter" },
      { status: 400 }
    );
  }

  // Validate URL format
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return NextResponse.json(
      { error: "Invalid URL format" },
      { status: 400 }
    );
  }

  // Only allow http/https
  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return NextResponse.json(
      { error: "Only http and https protocols are allowed" },
      { status: 400 }
    );
  }

  // Check if host is allowed
  if (!isAllowedHost(url)) {
    return NextResponse.json(
      { error: `Host not allowed: ${parsedUrl.hostname}` },
      { status: 403 }
    );
  }

  try {
    // Forward headers from client (except host-related headers)
    const forwardHeaders: HeadersInit = {
      "User-Agent":
        request.headers.get("User-Agent") ||
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: request.headers.get("Accept") || "application/json",
      "Accept-Language": request.headers.get("Accept-Language") || "vi-VN,vi;q=0.9,en;q=0.8",
      Referer: `${parsedUrl.origin}/`,
    };

    const response = await fetch(url, {
      headers: forwardHeaders,
      // Cache on server side
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Upstream error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("Content-Type") || "";

    // Handle JSON responses
    if (contentType.includes("application/json")) {
      const data = await response.json();
      return NextResponse.json(data, {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
          "X-Proxy-Cache": "HIT",
        },
      });
    }

    // Handle image responses
    if (contentType.startsWith("image/")) {
      const buffer = await response.arrayBuffer();
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=86400, immutable",
          "X-Proxy-Cache": "HIT",
        },
      });
    }

    // Handle text/html and other text responses
    if (contentType.startsWith("text/")) {
      const text = await response.text();
      return new NextResponse(text, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    // Default: return as blob
    const blob = await response.blob();
    return new NextResponse(blob, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("[Proxy] Error:", error);
    return NextResponse.json(
      { error: "Internal proxy error" },
      { status: 500 }
    );
  }
}

// Support HEAD requests for preflight checks
export async function HEAD(request: NextRequest) {
  return GET(request);
}