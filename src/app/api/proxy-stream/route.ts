import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": new URL(url).origin + "/",
      },
    });

    if (!response.ok) {
      return new NextResponse(`Failed to fetch: ${response.statusText}`, { status: response.status });
    }

    const contentType = response.headers.get("Content-Type") || "";
    
    // If it's a playlist (m3u8), we need to rewrite internal URLs
    if (url.includes(".m3u8") || contentType.includes("mpegurl") || contentType.includes("application/x-mpegURL") || url.endsWith(".m3u8")) {
      let body = await response.text();
      const urlObj = new URL(url);
      const origin = urlObj.origin;
      const baseUrl = url.substring(0, url.lastIndexOf("/") + 1);

      // Function to get absolute URL from relative path
      const getAbsoluteUrl = (path: string) => {
        if (path.startsWith("http")) return path;
        if (path.startsWith("/")) return origin + path;
        return baseUrl + path;
      };

      // 1. Rewrite URI attributes inside tags (e.g., #EXT-X-KEY:URI="...")
      body = body.replace(/URI="([^"]+)"/g, (match, p1) => {
        return `URI="/api/proxy-stream?url=${encodeURIComponent(getAbsoluteUrl(p1))}"`;
      });

      // 2. Rewrite playlist and segment URLs (lines not starting with #)
      const lines = body.split("\n");
      const processedLines = lines.map(line => {
        const trimmed = line.trim();
        if (trimmed === "" || trimmed.startsWith("#")) return line;
        
        // This is a URL or path
        return `/api/proxy-stream?url=${encodeURIComponent(getAbsoluteUrl(trimmed))}`;
      });
      
      body = processedLines.join("\n");

      return new NextResponse(body, {
        headers: {
          "Content-Type": "application/vnd.apple.mpegurl",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-cache",
        },
      });
    }

    // For other files (like .ts segments), return as is with CORS headers
    const blob = await response.blob();
    return new NextResponse(blob, {
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
