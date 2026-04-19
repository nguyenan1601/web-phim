import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

// Using Outfit for modern display text
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

// Using Inter for readable UI text
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
});

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: {
    default: "XemPhim - Xem Phim Mới Cập Nhật Nhanh Nhất",
    template: "%s | XemPhim",
  },
  description:
    "XemPhim - Kho phim khổng lồ hoàn toàn miễn phí. Phim mới cập nhật mỗi ngày, chất lượng HD, Vietsub. Trải nghiệm xem phim cao cấp không quảng cáo.",
  keywords: ["xem phim", "phim moi", "phim hay", "phim hd", "phim vietsub", "xemphim"],
  applicationName: "XemPhim",
  authors: [{ name: "XemPhim Team" }],
  creator: "XemPhim",
  publisher: "XemPhim",
  metadataBase: new URL("https://phim.nguonc.com"),
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "https://phim.nguonc.com",
    siteName: "XemPhim",
    title: "XemPhim - Xem Phim Mới Cập Nhật Nhanh Nhất",
    description: "XemPhim - Kho phim khổng lồ hoàn toàn miễn phí. Phim mới cập nhật mỗi ngày, chất lượng HD, Vietsub.",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "XemPhim - Xem Phim Online Miễn Phí",
    description: "Kho phim khổng lồ miễn phí. Cập nhật mỗi ngày.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

import Toaster from "@/components/ui/Toaster";
import HistorySync from "@/components/history/HistorySync";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html
      lang="vi"
      className={`${outfit.variable} ${inter.variable} antialiased dark`}
    >
      <body className="min-h-screen flex flex-col overflow-x-hidden font-sans bg-black text-white selection:bg-amber-500/30">
        <Navbar user={user} />
        <HistorySync userId={user?.id} />
        <main className="flex-1 flex flex-col overflow-x-hidden pt-16">{children}</main>
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
