"use client";

import { useEffect, useRef, useState } from "react";
import { Channel, Crt, Static } from "@/components/Crt";
import { GENRES, type Genre } from "@/lib/genres";
import { blip, setMuted } from "@/lib/blips";
import { shrinkUpload, svgToDataUrl, type Composed } from "@/lib/compose";
import { PASS_KEY, STEPS, STEP_LABEL, useKit, type StepState } from "@/lib/useKit";
import { buildZip } from "@/lib/zip";

type Screen = "store" | "insert" | "kit";

// The kit bundled in /public/demo (generated live during testing).
const DEMO_GAME = {
  name: "Frostbound",
  pitch: "An open-world fantasy RPG where a dragon-blooded exile roams frozen northern kingdoms relearning forgotten rune magic.",
  aisle: "rpg",
};

export default function Home() {
  const [screen, setScreen] = useState<Screen>("store");
  const [genre, setGenre] = useState<Genre>(GENRES[0]);
  const [sound, setSound] = useState(true);
  const [name, setName] = useState(GENRES[0].example.name);
  const [pitch, setPitch] = useState(GENRES[0].example.pitch);
  const [shot, setShot] = useState<string>();
  const [zoom, setZoom] = useState<Composed>();
  const [zipping, setZipping] = useState(false);
  const [demo, setDemo] = useState(false);

  const kit = useKit((id, ok) => {
    if (!ok) blip.back();
    else if (id === "sting") blip.done();
    else blip.select();
  });

  useEffect(() => setMuted(!sound), [sound]);

  // ?screen=insert|kit jumps straight to a screen (handy for demos and previews)
  useEffect(() => {
    const s = new URLSearchParams(location.search).get("screen");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (s === "insert" || s === "kit") setScreen(s);
    // ?demo=1: stage-safe mode. Press Start replays a pre-generated kit (no API calls).
    if (new URLSearchParams(location.search).get("demo") === "1") {
      setDemo(true);
      setGenre(GENRES.find((g) => g.id === DEMO_GAME.aisle) ?? GENRES[0]);
      setName(DEMO_GAME.name);
      setPitch(DEMO_GAME.pitch);
      // &play=1 starts the replay right away (kiosk screen at the booth)
      if (new URLSearchParams(location.search).get("play") === "1") {
        setScreen("kit");
        kit.replay();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Theme: aisle colors in the store, generated palette once a kit exists.
  useEffect(() => {
    const s = document.documentElement.style;
    const p = kit.brief?.palette;
    s.setProperty("--brand", p?.[0]?.hex ?? genre.colors[0]);
    s.setProperty("--brand-2", p?.[4]?.hex ?? p?.[1]?.hex ?? genre.colors[1]);
    s.setProperty("--floor", p?.[0]?.hex ?? (genre.id === "own" ? "#e8463a" : genre.colors[0]));
  }, [genre, kit.brief]);

  const go = (s: Screen) => { setScreen(s); window.scrollTo({ top: 0 }); };

  function pickGenre(g: Genre) {
    setGenre(g);
    if (demo) return; // keep the demo game's title/pitch on every aisle
    if (g.example.name && (!name || GENRES.some((x) => x.example.name === name))) {
      setName(g.example.name);
      setPitch(g.example.pitch);
    }
    if (g.id === "own" && GENRES.some((x) => x.example.name === name)) { setName(""); setPitch(""); }
  }

  function start() {
    if (!name.trim() || !pitch.trim()) return;
    blip.start();
    go("kit");
    if (demo) kit.replay();
    else kit.generate({ name, pitch, screenshot: shot, direction: genre.direction || undefined });
  }

  async function download() {
    if (!kit.brief) return;
    blip.select();
    setZipping(true);
    try {
      const blob = await buildZip({ brief: kit.brief, logo: kit.logo, keyArt: kit.keyArt, emblemSvg: kit.emblem, capsules: kit.capsules, icons: kit.icons, sounds: kit.sounds, videoUrl: kit.video.url, trailerUrl: kit.trailer.url });
      const file = new File([blob], `${kit.brief.title.replace(/\W+/g, "-")}-launch-kit.zip`, { type: "application/zip" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `${kit.brief.title} launch kit` }).catch(() => {});
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = file.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      }
    } finally {
      setZipping(false);
    }
  }

  const hasKit = kit.steps.brief.status !== "idle";

  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      <div className="stars pointer-events-none fixed inset-0" />
      <Hud
        right={
          <button onClick={() => { setSound((v) => !v); blip.move(); }} className="pill hud flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-base">
            <span className="text-brand">{sound ? "♪" : "×"}</span> Sound
          </button>
        }
      />

      {screen === "store" && <StoreFloor genre={genre} onPick={pickGenre} onStart={() => { blip.select(); go("insert"); }} />}
      {screen === "insert" && (
        <Insert
          genre={genre}
          name={name} setName={setName}
          pitch={pitch} setPitch={setPitch}
          shot={shot} setShot={setShot}
          onBack={() => { blip.back(); go("store"); }}
          onStart={start}
        />
      )}
      {screen === "kit" && <KitWall kit={kit} onZoom={(c) => { blip.move(); setZoom(c); }} />}

      {/* floating glass nav, like the reference */}
      <nav className="safe-b pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4">
        <div className="pill pointer-events-auto flex items-center gap-1 rounded-2xl p-1.5">
          <NavBtn active={screen === "store"} onClick={() => { blip.move(); go("store"); }} icon="▦" label="Store" />
          <NavBtn active={screen === "insert"} onClick={() => { blip.move(); go("insert"); }} icon="▣" label="Insert" />
          <NavBtn active={screen === "kit"} disabled={!hasKit} onClick={() => { blip.move(); go("kit"); }} icon="⧗" label="My kit" />
          {screen === "kit" && (
            <button
              disabled={kit.steps.store.status !== "ok" || zipping}
              onClick={download}
              className="hud ml-1 rounded-xl bg-brand px-3.5 py-2.5 text-lg text-black disabled:opacity-40"
            >
              {zipping ? "Packing" : "⇩ .zip"}
            </button>
          )}
        </div>
      </nav>

      {kit.steps.brief.error === "PASSCODE" && (
        <PassGate
          onSubmit={(code) => {
            try { localStorage.setItem(PASS_KEY, code.trim()); } catch {}
            start();
          }}
          onCancel={() => { kit.reset(); go("insert"); }}
        />
      )}

      {zoom && (
        <div className="fixed inset-0 z-40 flex flex-col bg-black/90 p-4 backdrop-blur" onClick={() => setZoom(undefined)}>
          <div className="safe-t hud flex items-center justify-between text-lg">
            <span>{zoom.capsule.platform} · {zoom.capsule.label} · {zoom.capsule.w}×{zoom.capsule.h}</span>
            <span className="pill rounded-lg px-2 py-1">Close</span>
          </div>
          <div className="grid flex-1 place-items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={zoom.dataUrl} alt="" className={`max-h-[75dvh] max-w-full rounded-lg ${zoom.capsule.transparent ? "checker" : ""}`} />
          </div>
          <p className="safe-b hud text-center text-base text-white/60">Long-press to save</p>
        </div>
      )}
    </div>
  );
}

/* ================= HUD ================= */

function Hud({ right }: { right: React.ReactNode }) {
  return (
    <header className="safe-t sticky top-0 z-20 flex items-center gap-2 px-4 pb-2">
      <svg width="24" height="24" viewBox="0 0 32 32" aria-hidden>
        <rect width="32" height="32" rx="8" fill="var(--brand)" />
        <path d="M10 22 L16 8 L22 22 L16 18 Z" fill="#050407" />
      </svg>
      <span className="hud flex-1 text-xl">Launch<span className="text-brand">Kit</span></span>
      <span className="hud mr-2 hidden text-base text-muted min-[380px]:inline">Credits ∞</span>
      {right}
    </header>
  );
}

function NavBtn({ active, disabled, onClick, icon, label }: { active: boolean; disabled?: boolean; onClick: () => void; icon: string; label: string }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-medium transition disabled:opacity-30 ${active ? "bg-white/12 text-white" : "text-white/70"}`}
    >
      <span className="text-brand">{icon}</span>
      {label}
    </button>
  );
}

/* ================= STORE FLOOR ================= */

function StoreFloor({ genre, onPick, onStart }: { genre: Genre; onPick: (g: Genre) => void; onStart: () => void }) {
  const rail = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(0); // fractional index under the center line
  const last = useRef(0);

  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const card = el.querySelector<HTMLElement>("[data-card]");
        if (!card) return;
        const step = card.offsetWidth + 16;
        const p = el.scrollLeft / step;
        setPos(p);
        const i = Math.round(p);
        if (i !== last.current && GENRES[i]) {
          last.current = i;
          blip.move();
          onPick(GENRES[i]);
        }
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [onPick]);

  function scrollTo(i: number, behavior: ScrollBehavior = "smooth") {
    const el = rail.current;
    const card = el?.querySelector<HTMLElement>("[data-card]");
    if (el && card) el.scrollTo({ left: i * (card.offsetWidth + 16), behavior });
  }

  // ?aisle=<id> opens the store on that aisle (e.g. ?aisle=shooter), handy for links and screenshots
  useEffect(() => {
    const id = new URLSearchParams(location.search).get("aisle");
    const i = GENRES.findIndex((g) => g.id === id);
    if (i <= 0) return;
    requestAnimationFrame(() => {
      scrollTo(i, "auto");
      last.current = i;
      setPos(i);
      onPick(GENRES[i]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="relative pb-32">
      <div className="px-4 pt-3 text-center">
        <p aria-hidden className="mb-1.5 flex justify-center gap-2 text-xl">
          {["🎮", "👾", "📹", "🎧"].map((e, i) => (
            <span key={e} className="float inline-block" style={{ animationDelay: `${i * 0.25}s` }}>
              {e}
            </span>
          ))}
        </p>
        <h1 className="chroma font-display text-[2.1rem] leading-[0.95] font-extrabold tracking-tight">Choose your style.</h1>
        <p className="mx-auto mt-2 max-w-[19rem] text-sm leading-snug text-white/75">
          Get your logo, trailer, art and every Steam size in minutes. No design skills needed.
        </p>
      </div>

      {/* curved wall of TVs */}
      <div className="relative mt-5" style={{ perspective: "900px" }}>
        <div
          ref={rail}
          className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto py-6"
          style={{ paddingInline: "calc((100vw - min(68vw, 300px)) / 2)", transformStyle: "preserve-3d" }}
        >
          {GENRES.map((g, i) => {
            const d = i - pos;
            const ad = Math.min(Math.abs(d), 2);
            return (
              <div
                key={g.id}
                data-card
                className="shrink-0 snap-center"
                style={{
                  width: "min(68vw, 300px)",
                  transform: `rotateY(${-d * 28}deg) translateZ(${-ad * 60}px) scale(${1 - ad * 0.08})`,
                  opacity: 1 - ad * 0.3,
                  transition: "transform 80ms linear",
                }}
              >
                <Crt glow={g.colors[0]} title={g.name} subtitle={g.blurb} onClick={() => (Math.round(pos) === i ? onStart() : scrollTo(i))}>
                  {g.id === "own" ? <Static tint={g.colors[1]} label="No signal" /> : <Channel colors={g.colors} name={g.name} art={g.art} />}
                </Crt>
              </div>
            );
          })}
        </div>
        {/* dots */}
        <div className="flex justify-center gap-1.5">
          {GENRES.map((g, i) => (
            <button key={g.id} onClick={() => scrollTo(i)} aria-label={g.name} className={`h-1.5 rounded-full transition-all ${Math.round(pos) === i ? "w-5 bg-brand" : "w-1.5 bg-white/25"}`} />
          ))}
        </div>
      </div>

      {/* spotlight floor + player */}
      <div className="relative mx-auto mt-2 h-56 max-w-md">
        <div className="spot-floor absolute inset-x-[-20%] top-6 h-56" style={{ transform: "perspective(400px) rotateX(62deg)" }} />
        <Player />
        <div className="absolute inset-x-0 bottom-3 flex flex-col items-center gap-2">
          <button onClick={onStart} className="hud rounded-xl bg-brand px-6 py-3 text-2xl text-black shadow-[0_0_40px_-5px_var(--brand)] transition active:scale-95">
            Press start ▸
          </button>
          <p className="hud blink text-base text-white/70">{genre.id === "own" ? "Bring your own idea" : `Aisle: ${genre.name}`}</p>
        </div>
      </div>
    </main>
  );
}

function Player() {
  return (
    <svg className="float absolute left-1/2 top-0 -translate-x-1/2" width="54" height="120" viewBox="0 0 54 120" aria-hidden>
      <ellipse cx="27" cy="114" rx="20" ry="5" fill="#000" opacity=".55" />
      <g fill="#140b10">
        <circle cx="27" cy="12" r="9" />
        <path d="M14 26 Q27 20 40 26 L44 70 Q40 74 36 72 L34 110 L29 110 L27 76 L25 110 L20 110 L18 72 Q14 74 10 70 Z" />
      </g>
      <path d="M14 26 Q27 20 40 26" stroke="var(--brand)" strokeOpacity=".5" fill="none" />
    </svg>
  );
}

/* ================= INSERT CARTRIDGE ================= */

function Insert(p: {
  genre: Genre;
  name: string; setName: (v: string) => void;
  pitch: string; setPitch: (v: string) => void;
  shot?: string; setShot: (v?: string) => void;
  onBack: () => void; onStart: () => void;
}) {
  const ready = p.name.trim() && p.pitch.trim();
  return (
    <main className="mx-auto max-w-md px-4 pb-32">
      <button onClick={p.onBack} className="hud mt-1 text-lg text-muted">◂ Back to store</button>

      <div className="mt-3">
        <Crt glow={p.genre.colors[0]} ratio="16/9" size="lg" reflect={false}>
          {p.shot ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.shot} alt="" className="tune h-full w-full object-cover" />
          ) : p.genre.id === "own" ? (
            <Static tint={p.genre.colors[1]} />
          ) : (
            <Channel colors={p.genre.colors} name={p.genre.name} art={p.genre.art} />
          )}
          <div className="absolute inset-0 grid place-items-center p-6 text-center">
            <div>
              <p className="hud text-base text-white/70">{p.genre.name}</p>
              <p className="chroma font-display text-3xl leading-none font-extrabold break-words">{p.name || "Your game"}</p>
              <p className="hud blink mt-3 text-lg text-white/80">{ready ? "Ready — press start" : "Insert cartridge"}</p>
            </div>
          </div>
        </Crt>
      </div>

      <form className="mt-6 space-y-4" onSubmit={(e) => { e.preventDefault(); p.onStart(); }}>
        <Field label="Player 1 — Game title">
          <input
            value={p.name}
            onChange={(e) => p.setName(e.target.value)}
            onFocus={() => blip.move()}
            placeholder="ENTER TITLE"
            maxLength={40}
            className="w-full bg-transparent font-display text-2xl font-extrabold outline-none placeholder:text-white/25"
          />
        </Field>
        <Field label="What's the game?">
          <textarea
            value={p.pitch}
            onChange={(e) => p.setPitch(e.target.value)}
            onFocus={() => blip.move()}
            placeholder="Genre, hook, vibe — one or two lines."
            rows={3}
            maxLength={300}
            className="w-full resize-none bg-transparent text-base outline-none placeholder:text-white/30"
          />
        </Field>

        <label className="pill flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-3">
          {p.shot ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.shot} alt="" className="h-11 w-11 rounded-lg object-cover" />
          ) : (
            <span className="hud grid h-11 w-11 place-items-center rounded-lg bg-white/10 text-2xl">+</span>
          )}
          <span className="flex-1 text-sm">
            <span className="block font-medium">{p.shot ? "Screenshot loaded" : "Add a screenshot"}</span>
            <span className="text-muted">Optional — matches your real art style</span>
          </span>
          {p.shot && <button type="button" onClick={(e) => { e.preventDefault(); p.setShot(undefined); }} className="hud text-base text-muted">Eject</button>}
          <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) p.setShot(await shrinkUpload(f)); }} />
        </label>

        <button disabled={!ready} className="hud w-full rounded-2xl bg-brand py-4 text-3xl text-black shadow-[0_0_50px_-8px_var(--brand)] transition active:scale-[0.98] disabled:opacity-30 disabled:shadow-none">
          Press start ▸
        </button>
        <p className="hud text-center text-base text-muted">No design skills needed · art in ~1 min, full kit in ~4</p>
      </form>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 pt-2.5 pb-3 focus-within:border-brand">
      <span className="hud mb-1 block text-base text-brand">{label}</span>
      {children}
    </label>
  );
}

/* ================= KIT WALL ================= */

function KitWall({ kit, onZoom }: { kit: ReturnType<typeof useKit>; onZoom: (c: Composed) => void }) {
  const { steps, brief, logo, keyArt, emblem, icons, sounds, capsules, legible, video, trailer } = kit;
  const hero = capsules.find((c) => c.capsule.id === "steam-main");
  const doneCount = STEPS.filter((s) => steps[s].status === "ok" || steps[s].status === "err").length;
  const loading = STEPS.some((s) => steps[s].status === "run");
  const glow = brief?.palette[0]?.hex;

  return (
    <main className="mx-auto max-w-md px-4 pb-32">
      {/* loading bar */}
      <div className="mt-1">
        <div className="hud flex justify-between text-lg">
          <span className={loading ? "blink" : ""}>{loading ? "Now loading" : doneCount === STEPS.length ? "Stage clear!" : "Ready"}</span>
          <span className="text-muted">{doneCount}/{STEPS.length}</span>
        </div>
        <div className="mt-1 flex gap-1">
          {STEPS.map((s) => (
            <span key={s} className={`h-2.5 flex-1 rounded-sm ${steps[s].status === "ok" ? "bg-brand" : steps[s].status === "err" ? "bg-red-500" : steps[s].status === "run" ? "blink bg-white/50" : "bg-white/10"}`} />
          ))}
        </div>
      </div>

      {/* hero */}
      <div className="mt-5">
        <Crt glow={glow} ratio="1232/706" size="lg" reflect={false} onClick={hero ? () => onZoom(hero) : undefined}>
          {hero ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hero.dataUrl} alt="Main capsule" className="tune h-full w-full object-cover" />
          ) : keyArt ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={keyArt} alt="Key art" className="tune h-full w-full object-cover" />
          ) : (
            <Static tint={glow} label={steps.brief.status === "run" ? "Tuning…" : "Painting key art"} />
          )}
        </Crt>
        {brief ? (
          <div className="rise mt-4">
            <p className="hud text-lg text-brand">{brief.genre}</p>
            <h2 className="chroma font-display text-[1.9rem] leading-[0.98] font-extrabold tracking-tight">{brief.title}</h2>
            <p className="mt-1 text-base text-white/80">{brief.tagline}</p>
          </div>
        ) : (
          <div className="mt-4 space-y-2"><div className="h-4 w-24 rounded bg-white/10" /><div className="h-8 w-3/4 rounded bg-white/10" /></div>
        )}
      </div>

      {/* step log */}
      {(loading || STEPS.some((s) => steps[s].status === "err")) && (
        <div className="pill mt-5 rounded-2xl p-3">
          <ul className="space-y-1.5">
            {STEPS.map((s) => <StepRow key={s} label={STEP_LABEL[s]} st={steps[s]} extra={s === "sting" ? video.status : s === "trailer" ? trailer.status : undefined} />)}
          </ul>
        </div>
      )}

      {/* palette cartridges */}
      {brief && (
        <Shelf title="Palette">
          <div className="grid grid-cols-5 gap-2">
            {brief.palette.map((p) => (
              <button key={p.hex + p.name} onClick={() => { navigator.clipboard?.writeText(p.hex); blip.move(); }} className="text-left">
                <span className="block aspect-[3/4] rounded-t-lg rounded-b-sm border border-white/15 shadow-[inset_0_-10px_0_rgba(0,0,0,0.25)]" style={{ background: p.hex }} />
                <span className="hud mt-1 block truncate text-sm">{p.name}</span>
                <span className="block font-mono text-[10px] text-muted">{p.hex}</span>
              </button>
            ))}
          </div>
        </Shelf>
      )}

      {/* brand TVs */}
      <Shelf title="Brand">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Crt glow={glow} size="sm" reflect={false}>
              <div className="checker absolute inset-0" />
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="Title logo" className="tune absolute inset-0 h-full w-full object-contain p-3" />
              ) : steps.logo.status === "err" ? <Err msg={steps.logo.error} /> : <Static tint={glow} />}
            </Crt>
            <Label a="Title logo" b="Transparent PNG" />
          </div>
          <div>
            <Crt glow={glow} size="sm" reflect={false}>
              <div className="absolute inset-0 bg-[#0d0b12]" />
              {emblem ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={svgToDataUrl(emblem)} alt="Emblem" className="tune absolute inset-0 h-full w-full object-contain p-4" />
              ) : steps.emblem.status === "err" ? <Err msg={steps.emblem.error} /> : <Static tint={glow} />}
            </Crt>
            <Label a="Emblem" b="Vector SVG" />
          </div>
        </div>
      </Shelf>

      {/* sting */}
      <Shelf title="Title sting">
        <Crt glow={glow} ratio="16/9" reflect={false}>
          {video.url ? (
            <video src={video.url} className="tune h-full w-full object-cover" controls playsInline autoPlay loop />
          ) : steps.sting.status === "err" ? (
            <Err msg={steps.sting.error} />
          ) : (
            <>
              {hero && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={hero.dataUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
              )}
              <div className="absolute inset-0 grid place-items-center">
                <span className="hud blink rounded bg-black/60 px-2 py-1 text-lg">
                  {steps.sting.status === "run" ? `${video.status ?? "Submitting"} · ~1–2 min` : "Waits for store art"}
                </span>
              </div>
            </>
          )}
        </Crt>
        {video.url && (
          <a href={video.url} target="_blank" rel="noreferrer" download className="pill hud mt-3 inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-lg">
            <span className="text-brand">⇩</span> Save video (.mp4)
          </a>
        )}
      </Shelf>

      {/* game trailer */}
      <Shelf title="Game trailer" aside="12 s · music + narrator">
        <Crt glow={glow} ratio="16/9" reflect={false}>
          {trailer.url ? (
            <video src={trailer.url} className="tune h-full w-full object-cover" controls playsInline loop />
          ) : steps.trailer.status === "err" ? (
            <Err msg={steps.trailer.error} />
          ) : (
            <>
              {keyArt && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={keyArt} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
              )}
              <div className="absolute inset-0 grid place-items-center">
                <span className="hud blink rounded bg-black/60 px-2 py-1 text-lg">
                  {steps.trailer.status === "run" ? `${trailer.status ?? "Submitting"} · ~2–3 min` : "Waits for key art"}
                </span>
              </div>
            </>
          )}
        </Crt>
        {trailer.url && (
          <a href={trailer.url} target="_blank" rel="noreferrer" download className="pill hud mt-3 inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-lg">
            <span className="text-brand">⇩</span> Save trailer (.mp4)
          </a>
        )}
      </Shelf>

      {/* store assets */}
      <Shelf title="Store shelf" aside={capsules.length ? `${capsules.length} files` : undefined}>
        {legible && (
          <div className={`mb-3 flex items-center gap-3 rounded-2xl border p-3 ${legible.readable ? "border-emerald-400/40 bg-emerald-400/10" : "border-amber-400/40 bg-amber-400/10"}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={legible.thumb} alt="" width={120} height={45} className="rounded border border-white/10" style={{ imageRendering: "pixelated" }} />
            <div className="text-xs">
              <p className="hud text-lg">Tiny-size test {legible.score}/10 {legible.readable ? "✓" : "!"}</p>
              <p className="text-white/70">{legible.tip}</p>
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-x-3 gap-y-4">
          {(capsules.length ? capsules : Array.from({ length: 4 }, () => null)).map((c, i) =>
            c ? (
              <div key={c.capsule.id} className="rise" style={{ animationDelay: `${i * 60}ms` }}>
                <Crt glow={glow} size="sm" ratio={`${c.capsule.w}/${c.capsule.h}`} reflect={false} onClick={() => onZoom(c)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.dataUrl} alt={c.capsule.label} className={`h-full w-full object-cover ${c.capsule.transparent ? "checker" : ""}`} />
                </Crt>
                <Label a={c.capsule.label} b={`${c.capsule.platform} · ${c.capsule.w}×${c.capsule.h}`} />
              </div>
            ) : (
              <div key={i}><Crt glow={glow} size="sm" ratio="920/430" reflect={false}><Static tint={glow} /></Crt></div>
            ),
          )}
        </div>
      </Shelf>

      {/* icons */}
      <Shelf title="UI icons">
        <div className="grid grid-cols-3 gap-3">
          {(icons.length ? icons : (brief?.icons ?? Array.from({ length: 6 }, (_, i) => ({ name: String(i) }))).map((x) => ({ name: x.name, svg: "" }))).map((ic) => (
            <div key={ic.name}>
              <Crt glow={glow} size="sm" ratio="1/1" reflect={false}>
                <div className="absolute inset-0 bg-[#0d0b12]" />
                {ic.svg ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={svgToDataUrl(ic.svg)} alt={ic.name} className="tune absolute inset-0 h-full w-full object-contain p-2" />
                ) : steps.icons.status === "err" ? <Err /> : <Static tint={glow} />}
              </Crt>
              <p className="hud mt-1 truncate text-center text-sm">{/^\d$/.test(ic.name) ? "" : ic.name}</p>
            </div>
          ))}
        </div>
      </Shelf>

      {/* arcade sound buttons */}
      <Shelf title="Sound kit">
        <div className="grid grid-cols-3 gap-3">
          {(sounds.length ? sounds : (brief?.sfx ?? [{ name: "Title sting" }, { name: "Menu select" }, { name: "Level up" }]).map((s) => ({ name: s.name, audio: "" }))).map((s, i) => (
            <ArcadeButton key={s.name} name={s.name} src={s.audio} color={brief?.palette[[0, 1, 4][i]]?.hex} failed={steps.sfx.status === "err"} />
          ))}
        </div>
      </Shelf>

      {/* manual */}
      {brief && (
        <Shelf title="Instruction manual">
          <div className="rounded-2xl border border-white/10 bg-[#f1ead9] p-4 text-[#1b1712]">
            <p className="hud text-lg text-[#b3361f]">Store copy</p>
            <p className="mt-1 text-sm">{brief.storeBlurb}</p>
            <ul className="mt-3 space-y-1 text-sm">
              {brief.features.map((f) => <li key={f} className="flex gap-2"><span className="text-[#b3361f]">▸</span>{f}</li>)}
            </ul>
            <button
              onClick={() => { navigator.clipboard?.writeText(`${brief.storeBlurb}\n\n${brief.features.map((f) => `• ${f}`).join("\n")}`); blip.select(); }}
              className="hud mt-3 rounded-lg bg-[#1b1712] px-3 py-1.5 text-base text-[#f1ead9]"
            >
              Copy text
            </button>
          </div>
        </Shelf>
      )}
    </main>
  );
}

function Shelf({ title, aside, children }: { title: string; aside?: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <div className="mb-2.5 flex items-baseline justify-between">
        <h3 className="hud text-xl text-white/90"><span className="text-brand">▌</span>{title}</h3>
        {aside && <span className="hud text-base text-muted">{aside}</span>}
      </div>
      {children}
    </section>
  );
}

function Label({ a, b }: { a: string; b: string }) {
  return (
    <div className="mt-1.5">
      <p className="text-xs font-semibold">{a}</p>
      <p className="font-mono text-[10px] text-muted">{b}</p>
    </div>
  );
}

function StepRow({ label, st, extra }: { label: string; st: StepState; extra?: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (st.status !== "run") return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [st.status]);
  const secs = st.t0 ? Math.round(((st.t1 ?? now) - st.t0) / 1000) : 0;
  return (
    <li className="flex items-center gap-2 text-sm">
      <span className="hud w-5 text-center text-lg">
        {st.status === "ok" ? <span className="text-emerald-400">✓</span> : st.status === "err" ? <span className="text-red-400">✕</span> : st.status === "run" ? <span className="blink text-brand">▶</span> : <span className="text-white/20">·</span>}
      </span>
      <span className={`flex-1 truncate ${st.status === "idle" ? "text-white/40" : ""}`}>
        {label}
        {st.status === "err" && <span className="block truncate text-xs text-red-300">{st.error}</span>}
        {st.status === "run" && extra && <span className="ml-1 text-xs text-muted">· {extra}</span>}
      </span>
      {st.status !== "idle" && <span className="hud text-base text-muted tabular-nums">{secs}s</span>}
    </li>
  );
}

function ArcadeButton({ name, src, color = "#ff5c39", failed }: { name: string; src: string; color?: string; failed: boolean }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  return (
    <div className="flex flex-col items-center">
      <button
        disabled={!src}
        onClick={() => { const a = ref.current; if (!a) return; if (a.paused) { a.currentTime = 0; a.play(); } else a.pause(); }}
        aria-label={`Play ${name}`}
        className="relative grid aspect-square w-full max-w-[92px] place-items-center rounded-full transition active:translate-y-1 disabled:opacity-35"
        style={{
          background: `radial-gradient(circle at 35% 30%, #ffffff66, transparent 40%), ${color}`,
          boxShadow: `0 6px 0 color-mix(in srgb, ${color} 55%, #000), 0 0 ${playing ? 40 : 18}px -4px ${color}`,
        }}
      >
        <span className="hud text-2xl text-black/80">{!src ? (failed ? "×" : "…") : playing ? "■" : "▶"}</span>
      </button>
      <p className="hud mt-3 text-center text-sm leading-tight">{name}</p>
      {src && <audio ref={ref} src={src} preload="auto" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} />}
    </div>
  );
}

function PassGate({ onSubmit, onCancel }: { onSubmit: (code: string) => void; onCancel: () => void }) {
  const [code, setCode] = useState("");
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/85 p-6 backdrop-blur">
      <form
        className="w-full max-w-sm"
        onSubmit={(e) => { e.preventDefault(); if (code.trim()) onSubmit(code); }}
      >
        <Crt glow="var(--brand)" ratio="4/3" reflect={false}>
          <Static tint="#ff5c39" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/55 p-6 text-center">
            <p className="hud blink text-2xl">Insert coin</p>
            <p className="text-sm text-white/75">This demo needs an access code.</p>
            <input
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="ACCESS CODE"
              autoCapitalize="characters"
              className="hud w-full rounded-xl border border-white/20 bg-black/60 px-4 py-3 text-center text-2xl outline-none focus:border-brand"
            />
          </div>
        </Crt>
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={onCancel} className="pill hud flex-1 rounded-xl py-3 text-xl">Back</button>
          <button className="hud flex-[2] rounded-xl bg-brand py-3 text-xl text-black">Continue ▸</button>
        </div>
      </form>
    </div>
  );
}

function Err({ msg }: { msg?: string }) {
  return <div className="absolute inset-0 grid place-items-center bg-black/70 p-3 text-center text-xs text-red-300">{msg ?? "Game over — retry"}</div>;
}
