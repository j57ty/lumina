import { Nav } from "@/components/Nav";
import { TutorChat } from "@/components/TutorChat";

export default async function TutorPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return (
    <div>
      <Nav />
      <main className="mx-auto max-w-3xl px-5 py-8">
        <p className="text-xs uppercase tracking-[0.28em] text-[var(--gold)]">Agentic tutor</p>
        <h1 className="serif mt-2 text-4xl text-[#f6efe2]">Ask out loud.</h1>
        <p className="mt-2 mb-6 text-[var(--mute)]">
          The tutor can search Lumina lessons, look at your enrollments, and recommend what to study
          next. Turn voice on and it will read the answer.
        </p>
        <TutorChat initialQuestion={q} />
      </main>
    </div>
  );
}
