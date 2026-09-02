"use client";

import { useState } from "react";
import { SpeakButton } from "@/components/SpeakButton";

export function LessonActions({ lessonId, text }: { lessonId: string; text: string }) {
  const [saved, setSaved] = useState(false);

  return (
    <div className="mt-5 flex flex-wrap gap-2">
      <SpeakButton text={text} label="Read this lesson aloud" />
      <button
        onClick={async () => {
          await fetch("/api/progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lessonId, status: "completed" }),
          });
          setSaved(true);
        }}
        className="rounded-full border border-[var(--line)] px-3 py-1 text-xs hover:border-[var(--gold)]"
      >
        {saved ? "Marked complete" : "Mark lesson complete"}
      </button>
    </div>
  );
}
