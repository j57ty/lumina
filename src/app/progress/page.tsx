import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Nav } from "@/components/Nav";

export default async function ProgressPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      progress: { include: { lesson: { include: { unit: { include: { course: true } } } } } },
      attempts: { orderBy: { createdAt: "desc" }, take: 8, include: { quiz: true } },
      badges: { include: { badge: true } },
    },
  });
  if (!user) redirect("/login");

  const done = user.progress.filter((p) => p.status === "completed");

  return (
    <div>
      <Nav />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="serif text-4xl text-[#f6efe2]">Progress</h1>
        <p className="mt-2 text-[var(--mute)]">
          {user.xp} XP · {user.streak}-day streak · {done.length} lessons complete
        </p>
        <section className="mt-8">
          <h2 className="serif text-2xl">Finished lessons</h2>
          <div className="mt-3 space-y-2">
            {done.length === 0 && <p className="text-sm text-[var(--mute)]">None yet. Open a lesson and mark it complete.</p>}
            {done.map((item) => (
              <div key={item.id} className="panel rounded-2xl px-4 py-3 text-sm">
                <p>{item.lesson.title}</p>
                <p className="text-xs text-[var(--mute)]">{item.lesson.unit.course.title}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="mt-8">
          <h2 className="serif text-2xl">Recent quizzes</h2>
          <div className="mt-3 space-y-2">
            {user.attempts.length === 0 && <p className="text-sm text-[var(--mute)]">No quizzes submitted yet.</p>}
            {user.attempts.map((attempt) => (
              <div key={attempt.id} className="panel flex items-center justify-between rounded-2xl px-4 py-3 text-sm">
                <span>{attempt.quiz.title}</span>
                <span className="text-[var(--gold)]">{attempt.score}%</span>
              </div>
            ))}
          </div>
        </section>
        <section className="mt-8">
          <h2 className="serif text-2xl">Badges</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {user.badges.length === 0 && <p className="text-sm text-[var(--mute)]">Earn your first badge by finishing a lesson.</p>}
            {user.badges.map((item) => (
              <span key={item.id} className="rounded-full border border-[var(--line)] px-3 py-1 text-xs text-[var(--gold)]">
                {item.badge.title}
              </span>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
