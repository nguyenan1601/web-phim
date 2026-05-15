import Image from "next/image";
import Link from "next/link";

type BrandLogoSize = "nav" | "footer" | "auth";

interface BrandLogoProps {
  size?: BrandLogoSize;
  className?: string;
  priority?: boolean;
}

const imageSizeClasses: Record<BrandLogoSize, string> = {
  nav: "h-10 w-[188px] sm:w-[216px]",
  footer: "h-8 w-[156px]",
  auth: "h-14 w-[260px]",
};

export default function BrandLogo({
  size = "nav",
  className = "",
  priority = false,
}: BrandLogoProps) {
  return (
    <Link
      href="/"
      aria-label="XemPhim"
      className={`inline-flex shrink-0 items-center transition-opacity hover:opacity-90 ${className}`}
    >
      <span className={`relative block ${imageSizeClasses[size]}`}>
        <Image
          src="/logo-xemphim-optimized.png"
          alt="XemPhim"
          fill
          sizes={
            size === "auth"
              ? "260px"
              : size === "footer"
                ? "156px"
                : "(min-width: 640px) 216px, 188px"
          }
          className="object-contain"
          priority={priority}
          unoptimized
        />
      </span>
    </Link>
  );
}
