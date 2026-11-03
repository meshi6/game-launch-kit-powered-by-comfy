"use client";
import type { CSSProperties, ReactNode } from "react";

/**
 * A curved-glass CRT screen: rounded bulging bezel, scanlines, glass highlight,
 * chromatic fringe, optional mirrored caption below (like a reflection on a glossy floor).
 */
export function Crt({
  children,
  glow = "#ff5c39",
  title,
  subtitle,
  ratio = "4/3",
  size = "md",
  className = "",
  style,
  onClick,
  reflect = true,
}: {
  children?: ReactNode;
  glow?: string;
  title?: string;
  subtitle?: string;
  ratio?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
  reflect?: boolean;
}) {
  const radius = size === "sm" ? "18% / 22%" : size === "lg" ? "9% / 12%" : "12% / 16%";
  const Tag = onClick ? "button" : "div";
  return (
    <Tag onClick={onClick} className={`crt group relative block w-full text-left ${className}`} style={{ ...style, ["--glow" as string]: glow }}>
      <div className="crt-bezel relative overflow-hidden" style={{ aspectRatio: ratio, borderRadius: radius }}>
        <div className="absolute inset-0">{children}</div>
        <div className="crt-scan pointer-events-none absolute inset-0" />
        <div className="crt-glass pointer-events-none absolute inset-0" style={{ borderRadius: radius }} />
        {title && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-[7%] pt-10 pb-[7%]">
            <p className={`chroma font-display leading-[0.95] font-extrabold tracking-tight text-white ${size === "sm" ? "text-base" : size === "lg" ? "text-3xl" : "text-2xl"}`}>{title}</p>
            {subtitle && <p className="mt-1 text-[12px] text-white/75">{subtitle}</p>}
          </div>
        )}
      </div>
      {reflect && title && (
        <div aria-hidden className="crt-reflect pointer-events-none mx-[7%] mt-1 select-none">
          <p className={`chroma font-display font-extrabold tracking-tight text-white ${size === "sm" ? "text-base" : "text-2xl"}`}>{title}</p>
        </div>
      )}
    </Tag>
  );
}

/** Animated TV static, for screens that haven't been "tuned" yet. */
export function Static({ tint = "#ffffff", label }: { tint?: string; label?: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      <div className="tv-static absolute -inset-[50%]" />
      <div className="absolute inset-0 mix-blend-color" style={{ background: tint, opacity: 0.35 }} />
      {label && (
        <div className="absolute inset-0 grid place-items-center">
          <span className="hud blink rounded bg-black/60 px-2 py-0.5 text-lg text-white">{label}</span>
        </div>
      )}
    </div>
  );
}

/** Genre "channel" art made of pure CSS, so the store works before any generation. */
export function Channel({ colors, name }: { colors: [string, string]; name: string }) {
  const [a, b] = colors;
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: `radial-gradient(120% 90% at 50% 110%, ${a} 0%, #120c1c 55%, #050308 100%)` }}>
      {/* horizon sun */}
      <div className="absolute left-1/2 top-[22%] aspect-square w-[46%] -translate-x-1/2 rounded-full opacity-90" style={{ background: `linear-gradient(${b}, ${a})`, maskImage: "repeating-linear-gradient(to bottom, #000 0 9%, transparent 9% 12%)" }} />
      {/* perspective grid floor */}
      <div className="grid-floor absolute inset-x-[-30%] bottom-0 h-[46%]" style={{ ["--line" as string]: b }} />
      <span className="hud absolute left-[7%] top-[7%] text-sm text-white/80">CH {name.length.toString().padStart(2, "0")}</span>
    </div>
  );
}
