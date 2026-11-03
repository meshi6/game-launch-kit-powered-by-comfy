"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { CAPSULES, type Brief } from "./types";
import { composeCapsule, loadImage, svgToDataUrl, thumbnail, trimLogo, type Composed } from "./compose";

export type StepId = "brief" | "logo" | "keyart" | "emblem" | "icons" | "sfx" | "store" | "sting";
export type StepState = { status: "idle" | "run" | "ok" | "err"; error?: string; t0?: number; t1?: number };

export const STEP_LABEL: Record<StepId, string> = {
  brief: "Style guide · Claude",
  logo: "Title logo · Ideogram + Bria",
  keyart: "Key art · Nano Banana Pro",
  emblem: "App emblem · Recraft",
  icons: "UI icons · Recraft",
  sfx: "Sound kit · ElevenLabs",
  store: "Store sizes + legibility",
  sting: "Title sting · Seedance",
};
export const STEPS = Object.keys(STEP_LABEL) as StepId[];

export const PASS_KEY = "launchkit-pass";
export function passHeader(): Record<string, string> {
  try {
    const p = localStorage.getItem(PASS_KEY);
    return p ? { "x-launch-pass": p } : {};
  } catch {
    return {};
  }
}

async function post<T>(url: string, body: unknown): Promise<T> {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", ...passHeader() }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({ error: `HTTP ${r.status}` }));
  if (!r.ok || j.error) throw new Error(j.error ?? `HTTP ${r.status}`);
  return j as T;
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const idle = () => Object.fromEntries(STEPS.map((s) => [s, { status: "idle" }])) as Record<StepId, StepState>;

export type KitInput = { name: string; pitch: string; screenshot?: string; direction?: string };

export function useKit(onStepDone?: (id: StepId, ok: boolean) => void) {
  const [steps, setSteps] = useState(idle);
  const [brief, setBrief] = useState<Brief>();
  const [logo, setLogo] = useState<string>();
  const [keyArt, setKeyArt] = useState<string>();
  const [emblem, setEmblem] = useState<string>();
  const [icons, setIcons] = useState<{ name: string; svg: string }[]>([]);
  const [sounds, setSounds] = useState<{ name: string; audio: string }[]>([]);
  const [capsules, setCapsules] = useState<Composed[]>([]);
  const [legible, setLegible] = useState<{ score: number; readable: boolean; tip: string; thumb: string }>();
  const [video, setVideo] = useState<{ url?: string; status?: string }>({});
  const runId = useRef(0);
  const cb = useRef(onStepDone);
  useEffect(() => {
    cb.current = onStepDone;
  });

  const mark = useCallback((id: StepId, s: Partial<StepState>) => setSteps((p) => ({ ...p, [id]: { ...p[id], ...s } })), []);

  const reset = useCallback(() => {
    runId.current++;
    setSteps(idle());
    setBrief(undefined); setLogo(undefined); setKeyArt(undefined); setEmblem(undefined);
    setIcons([]); setSounds([]); setCapsules([]); setLegible(undefined); setVideo({});
  }, []);

  const generate = useCallback(async (input: KitInput) => {
    reset();
    const my = ++runId.current;
    const alive = () => runId.current === my;

    async function step<T>(id: StepId, fn: () => Promise<T>): Promise<T | undefined> {
      mark(id, { status: "run", t0: Date.now(), error: undefined });
      try {
        const v = await fn();
        if (alive()) { mark(id, { status: "ok", t1: Date.now() }); cb.current?.(id, true); }
        return v;
      } catch (e) {
        if (alive()) { mark(id, { status: "err", t1: Date.now(), error: e instanceof Error ? e.message : String(e) }); cb.current?.(id, false); }
        return undefined;
      }
    }

    const b = await step("brief", () => post<Brief>("/api/brief", input));
    if (!b || !alive()) return;
    setBrief(b);

    const logoP = step("logo", async () => (await post<{ logo: string }>("/api/logo", b)).logo);
    const artP = step("keyart", async () => (await post<{ keyArt: string }>("/api/keyart", { brief: b, screenshot: input.screenshot })).keyArt);
    const embP = step("emblem", async () => (await post<{ svg: string }>("/api/emblem", b)).svg);
    step("icons", async () => {
      const r = await post<{ icons: { name: string; svg: string }[] }>("/api/icons", b);
      if (alive()) setIcons(r.icons);
    });
    step("sfx", async () => {
      const r = await post<{ sounds: { name: string; audio: string }[] }>("/api/sfx", b);
      if (alive()) setSounds(r.sounds);
    });
    logoP.then((v) => alive() && v && setLogo(v));
    artP.then((v) => alive() && v && setKeyArt(v));
    embP.then((v) => alive() && v && setEmblem(v));

    const [lg, art, emb] = await Promise.all([logoP, artP, embP]);
    if (!alive() || (!art && !lg)) return;

    const composed = await step("store", async () => {
      const assets = {
        logo: lg ? await trimLogo(lg) : undefined,
        keyArt: art ? await loadImage(art) : undefined,
        emblem: emb ? await loadImage(svgToDataUrl(emb)) : undefined,
      };
      const out: Composed[] = [];
      for (const c of CAPSULES) {
        const r = await composeCapsule(c, assets, b);
        if (r) out.push(r);
      }
      if (alive()) setCapsules(out);
      const small = out.find((c) => c.capsule.id === "steam-small");
      if (small) {
        const t = await thumbnail(small.dataUrl);
        post<{ score: number; readable: boolean; tip: string }>("/api/legibility", { title: b.title, thumb: t.big })
          .then((r) => alive() && setLegible({ ...r, thumb: t.small }))
          .catch(() => {});
      }
      return out;
    });
    if (!alive()) return;

    const main = composed?.find((c) => c.capsule.id === "steam-main");
    if (!main) return;
    step("sting", async () => {
      const { requestId } = await post<{ requestId: string }>("/api/sting", { brief: b, frame: main.dataUrl });
      for (let i = 0; i < 120 && alive(); i++) {
        await sleep(5000);
        const r = await fetch(`/api/sting?id=${encodeURIComponent(requestId)}`, { headers: passHeader() }).then((x) => x.json());
        if (r.status === "FAILED") throw new Error(r.error ?? "Video failed");
        if (r.error) throw new Error(r.error);
        if (r.status === "COMPLETED") {
          if (alive()) setVideo({ url: r.videoUrl, status: "COMPLETED" });
          return;
        }
        if (alive()) setVideo({ status: r.queuePosition ? `Queue #${r.queuePosition}` : "Rendering" });
      }
      throw new Error("Timed out");
    });
  }, [mark, reset]);

  return { steps, brief, logo, keyArt, emblem, icons, sounds, capsules, legible, video, generate, reset };
}
