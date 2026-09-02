"use client";

import { useEffect, useRef, useState } from "react";
import { speak, stopSpeaking } from "@/components/SpeakButton";

type Msg = { role: "user" | "assistant"; content: string };

export function TutorChat({ initialQuestion }: { initialQuestion?: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState(initialQuestion ?? "");
  const [pending, setPending] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [voiceOn, setVoiceOn] = useState(true);
  const [listening, setListening] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  const started = useRef(false);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  useEffect(() => {
    if (started.current) return;
    if (initialQuestion?.trim()) {
      started.current = true;
      void send(initialQuestion);
    }
  }, [initialQuestion]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || pending) return;
    setInput("");
    setMessages((current) => [...current, { role: "user", content: trimmed }]);
    setPending(true);
    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, conversationId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Tutor failed");
      setConversationId(data.conversationId);
      setMessages((current) => [...current, { role: "assistant", content: data.reply }]);
      if (voiceOn) speak(data.reply);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Tutor failed.";
      setMessages((current) => [...current, { role: "assistant", content: message }]);
    } finally {
      setPending(false);
    }
  }

  function listen() {
        type Rec = {
      lang: string;
      start: () => void;
      onend: (() => void) | null;
      onresult: ((event: { results: { 0: { 0: { transcript: string } } } }) => void) | null;
    };
    const Ctor = (
      window as unknown as {
        SpeechRecognition?: new () => Rec;
        webkitSpeechRecognition?: new () => Rec;
      }
    ).SpeechRecognition
      || (window as unknown as { webkitSpeechRecognition?: new () => Rec }).webkitSpeechRecognition;
    if (!Ctor) {
      alert("Speech recognition is not available in this browser. Chrome works best.");
      return;
    }
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.onresult = (event: { results: { 0: { 0: { transcript: string } } } }) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setListening(false);
      void send(transcript);
    };
    rec.onend = () => setListening(false);
    setListening(true);
    rec.start();
  }

  return (
    <div className="panel flex min-h-[70vh] flex-col rounded-3xl">
      <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-3 text-sm">
        <span className="serif text-lg">Tutor</span>
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (voiceOn) stopSpeaking();
              setVoiceOn((value) => !value);
            }}
            className="rounded-full border border-[var(--line)] px-3 py-1 text-xs"
          >
            {voiceOn ? "Voice on" : "Voice off"}
          </button>
        </div>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {messages.length === 0 && (
          <p className="text-[var(--mute)]">
            Ask for an explanation, a worked example, a study plan, or a quiz. I can look through the
            Lumina catalog and speak the answer.
          </p>
        )}
        {messages.map((message, index) => (
          <div
            key={index}
            className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${
              message.role === "user"
                ? "ml-auto bg-[var(--gold)] text-[#08111f]"
                : "bg-[#08111f] text-[var(--mist)]"
            }`}
          >
            {message.content}
          </div>
        ))}
        {pending && <p className="text-sm text-[var(--mute)]">Thinking…</p>}
        <div ref={bottom} />
      </div>
      <form
        className="flex gap-2 border-t border-[var(--line)] p-4"
        onSubmit={(event) => {
          event.preventDefault();
          void send(input);
        }}
      >
        <button
          type="button"
          onClick={listen}
          className="rounded-full border border-[var(--line)] px-3 text-xs text-[var(--gold)]"
        >
          {listening ? "Listening…" : "Mic"}
        </button>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Explain slope like I’m seeing it for the first time"
          className="flex-1 rounded-full border border-[var(--line)] bg-[#08111f] px-4 py-2 text-sm outline-none focus:border-[var(--gold)]"
        />
        <button className="rounded-full bg-[var(--gold)] px-4 text-sm font-medium text-[#08111f]">
          Send
        </button>
      </form>
    </div>
  );
}
