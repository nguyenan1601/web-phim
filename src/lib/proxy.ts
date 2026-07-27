/**
 * Proxy Helper
 * 
 * Helper functions để build proxy URLs cho API bên thứ 3.
 * Khi deploy trên Vercel hoặc các platform không thể gọi trực tiếp API,
 * sử dụng proxy route /api/proxy để forward requests.
 * 
 * Environment:
 *   - USE_API_PROXY: "true" để enable proxy (default: false)
 *   - API_PROXY_URL: Custom proxy URL (default: /api/proxy)
 */

const USE_PROXY = process.env.USE_API_PROXY === "true";
const PROXY_ROUTE = process.env.API_PROXY_URL || "/api/proxy";

/**
 * Build proxy URL cho một upstream URL.
 * Nếu proxy không được enable, trả về URL gốc.
 * 
 * @param upstreamUrl - URL cần proxy
 * @returns Proxy URL hoặc URL gốc
 */
export function buildProxyUrl(upstreamUrl: string): string {
  if (!USE_PROXY) {
    return upstreamUrl;
  }

  // Nếu PROXY_ROUTE là absolute URL (external proxy)
  if (PROXY_ROUTE.startsWith("http")) {
    const proxyUrl = new URL(PROXY_ROUTE);
    proxyUrl.searchParams.set("url", upstreamUrl);
    return proxyUrl.toString();
  }

  // Internal proxy route
  return `${PROXY_ROUTE}?url=${encodeURIComponent(upstreamUrl)}`;
}

/**
 * Kiểm tra proxy có được enable không.
 */
export function isProxyEnabled(): boolean {
  return USE_PROXY;
}

/**
 * Build image URL qua proxy.
 * Dùng cho ảnh từ phimapi.com, phimimg.com, etc.
 * 
 * @param imageUrl - URL ảnh gốc
 * @returns Proxy URL hoặc URL gốc
 */
export function buildImageProxyUrl(imageUrl: string): string {
  if (!imageUrl) return "";
  return buildProxyUrl(imageUrl);
}