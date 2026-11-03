import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Bricolage_Grotesque, VT323 } from "next/font/google";
import "./globals.css";

const sans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const display = Bricolage_Grotesque({ variable: "--font-display", subsets: ["latin"], weight: ["600", "800"] });
const hud = VT323({ variable: "--font-hud", subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: "Launch Kit",
  description: "Your game's whole storefront from one sentence — logo, key art, Steam capsules, UI icons, sounds and an animated title sting.",
  applicationName: "Launch Kit",
  appleWebApp: { capable: true, title: "Launch Kit", statusBarStyle: "black-translucent" },
  
  icons: { icon: "/icon.svg", apple: "/apple-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#050407",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${display.variable} ${hud.variable} h-full antialiased`}>
      <body className="grain min-h-full">{children}</body>
    </html>
  );
}
