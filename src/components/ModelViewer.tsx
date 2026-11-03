"use client";
import { createElement, useEffect, useState } from "react";

const SRC = "https://cdn.jsdelivr.net/npm/@google/model-viewer@4.4.0/dist/model-viewer.min.js";
let loading: Promise<void> | null = null;

function loadModelViewer(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (customElements.get("model-viewer")) return Promise.resolve();
  loading ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.type = "module";
    s.src = SRC;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Could not load the 3D viewer"));
    document.head.appendChild(s);
  });
  return loading;
}

/** Spin-able, auto-rotating 3D model; plays the GLB's first animation (e.g. walking). */
export function ModelViewer({ src, poster, alt }: { src: string; poster?: string; alt: string }) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    loadModelViewer().then(() => setReady(true), () => setFailed(true));
  }, []);
  if (failed) return <div className="absolute inset-0 grid place-items-center text-xs text-red-300">3D viewer failed to load</div>;
  if (!ready) return null;
  return createElement("model-viewer", {
    src,
    poster,
    alt,
    "camera-controls": true,
    "auto-rotate": true,
    "auto-rotate-delay": 0,
    "rotation-per-second": "24deg",
    autoplay: true,
    "shadow-intensity": "1",
    exposure: "1.1",
    "interaction-prompt": "none",
    "touch-action": "pan-y",
    style: { width: "100%", height: "100%", background: "transparent", ["--poster-color" as string]: "transparent" },
  });
}
