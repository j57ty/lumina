"use client";

import { useEffect, useState } from "react";

export function speak(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text.replace(/[#*`]/g, " "));
  utterance.rate = 1.02;
  utterance.pitch = 1;
  const voices = window.speechSynthesis.getVoices();
  const preferred =
    voices.find((v) => /en-GB|en-US/i.test(v.lang) && /female|natural|samantha|google/i.test(v.name)) ||
    voices.find((v) => /en/i.test(v.lang));
  if (preferred) utterance.voice = preferred;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (typeof window !== "undefined") window.speechSynthesis.cancel();
}

export function SpeakButton({ text, label = "Speak" }: { text: string; label?: string }) {
  const [on, setOn] = useState(false);

  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  return (
    <button
      type="button"
      onClick={() => {
        if (on) {
          stopSpeaking();
          setOn(false);
          return;
        }
        speak(text);
        setOn(true);
        const ms = Math.min(120000, Math.max(2500, text.length * 50));
        window.setTimeout(() => setOn(false), ms);
      }}
      className="rounded-full border border-[var(--line)] px-3 py-1 text-xs text-[var(--gold)] hover:border-[var(--gold)]"
    >
      {on ? "Stop voice" : label}
    </button>
  );
}
