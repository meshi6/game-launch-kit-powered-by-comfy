"use client";
import { useEffect, useRef, useState } from "react";

// Chrome / Android expose the Web Speech API under a webkit prefix; it isn't in TS's DOM lib.
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
};
type RecognitionCtor = new () => Recognition;

function getRecognition(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Tap to speak into a field. Shows live words while you talk; hidden where the browser has no speech recognition. */
export function MicButton({ onText, onStart }: { onText: (text: string, final: boolean) => void; onStart?: () => void }) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string>();
  const rec = useRef<Recognition | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(!!getRecognition());
    return () => rec.current?.stop();
  }, []);

  if (!supported) return null;

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (listening) {
      rec.current?.stop();
      return;
    }
    const Ctor = getRecognition();
    if (!Ctor) return;
    const r = new Ctor();
    r.lang = navigator.language || "en-US";
    r.interimResults = true;
    r.continuous = false;
    r.onresult = (ev) => {
      let text = "";
      let final = false;
      for (let i = 0; i < ev.results.length; i++) {
        text += ev.results[i][0].transcript;
        final = ev.results[i].isFinal;
      }
      onText(text.trim(), final);
    };
    r.onend = () => setListening(false);
    r.onerror = (ev) => {
      setListening(false);
      setError(ev.error === "not-allowed" ? "Allow the microphone to use voice" : undefined);
    };
    rec.current = r;
    setError(undefined);
    setListening(true);
    onStart?.();
    r.start();
  }

  return (
    <span className="flex items-center gap-2">
      {error && <span className="text-[11px] text-red-300">{error}</span>}
      <button
        type="button"
        onClick={toggle}
        aria-label={listening ? "Stop listening" : "Speak instead of typing"}
        className={`hud flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm transition ${listening ? "bg-red-500/90 text-white" : "bg-white/10 text-white/80"}`}
      >
        <span className={listening ? "blink" : ""}>{listening ? "●" : "🎙"}</span>
        {listening ? "Listening" : "Speak"}
      </button>
    </span>
  );
}
