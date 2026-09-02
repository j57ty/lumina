"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function EnrollButton({ courseId, enrolled }: { courseId: string; enrolled: boolean }) {
  const router = useRouter();
  const [on, setOn] = useState(enrolled);
  const [pending, setPending] = useState(false);

  if (on) {
    return <p className="text-sm text-[var(--gold)]">You are enrolled in this course.</p>;
  }

  return (
    <button
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await fetch("/api/enroll", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseId }),
        });
        setOn(true);
        setPending(false);
        router.refresh();
      }}
      className="rounded-full bg-[var(--gold)] px-4 py-2 text-sm font-medium text-[#08111f]"
    >
      {pending ? "Enrolling…" : "Enroll"}
    </button>
  );
}
