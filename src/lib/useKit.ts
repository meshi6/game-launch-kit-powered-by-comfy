"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { CAPSULES, type Brief } from "./types";
import { composeCapsule, loadImage, svgToDataUrl, thumbnail, trimLogo, type Composed } from "./compose";

export type StepId = "brief" | "logo" | "keyart" | "emblem" | "icons" | "sfx" | "store" | "sting" | "trailer" | "hero";
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
  trailer: "Game trailer · Seedance",
  hero: "3D hero · Meshy",
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

export type Hero3D = { status?: string; viewer?: string; rigged?: string; walking?: string; running?: string };

/** Route a provider-hosted GLB through /api/glb (the hosts send no CORS headers). */
export function glbProxy(url: string): string {
  let pass = "";
  try {
    pass = localStorage.getItem(PASS_KEY) ?? "";
  } catch {}
  return `/api/glb?u=${encodeURIComponent(url)}${pass ? `&pass=${encodeURIComponent(pass)}` : ""}`;
}

type JobData = {
  id?: string;
  result?: { rigged_character_glb_url?: string; basic_animations?: { walking_glb_url?: string; running_glb_url?: string } };
};

/** Poll any queued Router job (Meshy stages) through /api/job. */
async function pollJob(model: string, requestId: string, alive: () => boolean): Promise<JobData> {
  for (let i = 0; i < 150 && alive(); i++) {
    await sleep(6000);
    const r = await fetch(`/api/job?model=${encodeURIComponent(model)}&id=${encodeURIComponent(requestId)}`, { headers: passHeader() }).then((x) => x.json());
    if (r.status === "FAILED") throw new Error(r.error ?? "3D generation failed");
    if (r.error) throw new Error(r.error);
    if (r.status === "COMPLETED") return r.data as JobData;
  }
  throw new Error("Timed out");
}

/** Poll a queued Seedance request until it finishes; reports queue/render status. */
async function pollVideo(requestId: string, alive: () => boolean, onStatus: (s: string) => void): Promise<string> {
  for (let i = 0; i < 150 && alive(); i++) {
    await sleep(5000);
    const r = await fetch(`/api/sting?id=${encodeURIComponent(requestId)}`, { headers: passHeader() }).then((x) => x.json());
    if (r.status === "FAILED") throw new Error(r.error ?? "Video failed");
    if (r.error) throw new Error(r.error);
    if (r.status === "COMPLETED") return r.videoUrl as string;
    onStatus(r.queuePosition ? `Queue #${r.queuePosition}` : "Rendering");
  }
  throw new Error("Timed out");
}
const idle = () => Object.fromEntries(STEPS.map((s) => [s, { status: "idle" }])) as Record<StepId, StepState>;

async function urlToDataUrl(src: string): Promise<string> {
  const blob = await fetch(src).then((r) => r.blob());
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result as string);
    fr.onerror = rej;
    fr.readAsDataURL(blob);
  });
}

type Legible = { score: number; readable: boolean; tip: string; thumb: string };
type DemoKit = {
  brief: Brief;
  logo: string;
  keyArt: string;
  emblem: string;
  icons: { name: string; src: string }[];
  sounds: { name: string; src: string }[];
  video: string;
  trailer?: string;
  hero?: { viewer: string; rigged?: string; walking?: string; running?: string };
};

/** Build every store size on-device, then score the smallest one. */
async function composeStore(b: Brief, lg?: string, art?: string, emb?: string) {
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
  const small = out.find((c) => c.capsule.id === "steam-small");
  const thumb = small ? await thumbnail(small.dataUrl) : undefined;
  return { out, thumb };
}

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
  const [legible, setLegible] = useState<Legible>();
  const [video, setVideo] = useState<{ url?: string; status?: string }>({});
  const [trailer, setTrailer] = useState<{ url?: string; status?: string }>({});
  const [hero, setHero] = useState<Hero3D>({});
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
    setIcons([]); setSounds([]); setCapsules([]); setLegible(undefined); setVideo({}); setTrailer({}); setHero({});
  }, []);

  /** Shared runner: marks a step running/ok/err and fires the step sound. */
  const begin = useCallback(() => {
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
    return { alive, step };
  }, [mark, reset]);

  const generate = useCallback(async (input: KitInput) => {
    const { alive, step } = begin();

    const b = await step("brief", () => post<Brief>("/api/brief", input));
    if (!b || !alive()) return;
    setBrief(b);

    step("hero", async () => {
      const run = async (stage: "preview" | "refine" | "rig", label: string, taskId?: string) => {
        if (alive()) setHero((h) => ({ ...h, status: label }));
        const { requestId, model } = await post<{ requestId: string; model: string }>("/api/hero", { brief: b, stage, taskId });
        return pollJob(model, requestId, alive);
      };
      const preview = await run("preview", "Sculpting · 1/3");
      const refined = await run("refine", "Painting · 2/3", preview.id);
      const rigged = await run("rig", "Rigging · 3/3", refined.id);
      const r = rigged.result ?? {};
      const walking = r.basic_animations?.walking_glb_url;
      const viewer = walking ?? r.rigged_character_glb_url;
      if (!viewer) throw new Error("No 3D model returned");
      if (alive()) setHero({
        status: "COMPLETED",
        viewer: glbProxy(viewer),
        rigged: r.rigged_character_glb_url && glbProxy(r.rigged_character_glb_url),
        walking: walking && glbProxy(walking),
        running: r.basic_animations?.running_glb_url && glbProxy(r.basic_animations.running_glb_url),
      });
    });

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

    if (art) {
      step("trailer", async () => {
        const { requestId } = await post<{ requestId: string }>("/api/trailer", { brief: b, keyArt: art, logo: lg });
        const url = await pollVideo(requestId, alive, (st) => alive() && setTrailer({ status: st }));
        if (alive()) setTrailer({ url, status: "COMPLETED" });
      });
    }

    const composed = await step("store", async () => {
      const { out, thumb } = await composeStore(b, lg, art, emb);
      if (alive()) setCapsules(out);
      if (thumb) {
        post<Omit<Legible, "thumb">>("/api/legibility", { title: b.title, thumb: thumb.big })
          .then((r) => alive() && setLegible({ ...r, thumb: thumb.small }))
          .catch(() => {});
      }
      return out;
    });
    if (!alive()) return;

    const main = composed?.find((c) => c.capsule.id === "steam-main");
    if (!main) return;
    step("sting", async () => {
      const { requestId } = await post<{ requestId: string }>("/api/sting", { brief: b, frame: main.dataUrl });
      const url = await pollVideo(requestId, alive, (st) => alive() && setVideo({ status: st }));
      if (alive()) setVideo({ url, status: "COMPLETED" });
    });
  }, [begin]);

  /**
   * Stage-safe replay of a pre-generated kit (public/demo). Same screens, sounds
   * and on-device compositing as a live run, no API calls, ~15 seconds.
   */
  const replay = useCallback(async () => {
    const { alive, step } = begin();
    const m = (await fetch("/demo/kit.json").then((r) => r.json())) as DemoKit;
    const wait = <T,>(ms: number, fn: () => Promise<T>) => sleep(ms).then(fn);

    const b = await step("brief", () => wait(1800, async () => m.brief));
    if (!b || !alive()) return;
    setBrief(b);

    const logoP = step("logo", () => wait(4300, () => urlToDataUrl(m.logo)));
    const artP = step("keyart", () => wait(5400, () => urlToDataUrl(m.keyArt)));
    const embP = step("emblem", () => wait(3200, () => fetch(m.emblem).then((r) => r.text())));
    step("icons", () => wait(4800, async () => {
      const list = await Promise.all(m.icons.map(async (i) => ({ name: i.name, svg: await fetch(i.src).then((r) => r.text()) })));
      if (alive()) setIcons(list);
    }));
    step("sfx", () => wait(2400, async () => {
      const list = await Promise.all(m.sounds.map(async (s) => ({ name: s.name, audio: await urlToDataUrl(s.src) })));
      if (alive()) setSounds(list);
    }));
    logoP.then((v) => alive() && v && setLogo(v));
    artP.then((v) => alive() && v && setKeyArt(v));
    embP.then((v) => alive() && v && setEmblem(v));

    const [lg, art, emb] = await Promise.all([logoP, artP, embP]);
    if (!alive()) return;
    await step("store", async () => {
      const { out, thumb } = await composeStore(b, lg, art, emb);
      if (alive()) setCapsules(out);
      if (thumb) {
        sleep(1200).then(() => alive() && setLegible({
          score: 6,
          readable: true,
          tip: "The icy blue title blends into the similarly toned snowy background and the letters are blurry. Add a dark outline or drop shadow, or put a darker gradient behind the text, and increase the letter contrast.",
          thumb: thumb.small,
        }));
      }
    });
    if (!alive()) return;
    if (m.hero) {
      const h = m.hero;
      step("hero", async () => {
        for (const st of ["Sculpting · 1/3", "Painting · 2/3", "Rigging · 3/3"]) {
          if (!alive()) return;
          setHero({ status: st });
          await sleep(2600);
        }
        if (alive()) setHero({ status: "COMPLETED", ...h });
      });
    }
    if (m.trailer) {
      const trailerUrl = m.trailer;
      step("trailer", async () => {
        for (const s of ["Queue #2", "Rendering", "Rendering", "Rendering"]) {
          if (!alive()) return;
          setTrailer({ status: s });
          await sleep(2200);
        }
        if (alive()) setTrailer({ url: trailerUrl, status: "COMPLETED" });
      });
    }
    step("sting", async () => {
      for (const s of ["Queue #1", "Rendering", "Rendering"]) {
        if (!alive()) return;
        setVideo({ status: s });
        await sleep(2200);
      }
      if (alive()) setVideo({ url: m.video, status: "COMPLETED" });
    });
  }, [begin]);

  return { steps, brief, logo, keyArt, emblem, icons, sounds, capsules, legible, video, trailer, hero, generate, replay, reset };
}
