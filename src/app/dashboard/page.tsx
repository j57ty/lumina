import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Nav } from "@/components/Nav";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      badges: { include: { badge: true } },
      enrollments: {
        include: {
          course: {
            include: {
              units: { include: { lessons: { include: { progress: { where: { userId: session.user.id } } } } } },
            },
          },
        },
      },
    },
  });
  if (!user) redirect("/login");

  const catalog = await prisma.course.findMany({ orderBy: { subject: "asc" } });
  const completed = await prisma.lessonProgress.count({
    where: { userId: user.id, status: "completed" },
  });

  return (
    <div>
      <Nav />
      <main className="mx-auto max-w-6xl px-5 py-10">
        <p className="text-xs uppercase tracking-[0.28em] text-[var(--gold)]">Dashboard</p>
        <h1 className="serif mt-2 text-4xl text-[#f6efe2]">Hello, {user.name.split(" ")[0]}.</h1>
        <p className="mt-2 text-[var(--mute)]">
          Grade {user.gradeLevel} · {user.xp} XP · {user.streak}-day streak · {completed} lessons finished
        </p>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {user.enrollments.length === 0 ? (
            <div className="panel rounded-3xl p-6 md:col-span-3">
              <h2 className="serif text-2xl">No courses yet</h2>
              <p className="mt-2 text-[var(--mute)]">Pick one from the catalog. The tutor can help you choose.</p>
              <Link href="/courses" className="mt-4 inline-block text-[var(--gold)]">
                Browse courses →
              </Link>
            </div>
          ) : (
            user.enrollments.map((enrollment) => {
              const lessons = enrollment.course.units.flatMap((unit) => unit.lessons);
              const done = lessons.filter((lesson) =>
                lesson.progress.some((p) => p.status === "completed"),
              ).length;
              const pct = lessons.length ? Math.round((done / lessons.length) * 100) : 0;
              return (
                <Link
                  key={enrollment.id}
                  href={`/courses/${enrollment.course.slug}`}
                  className="panel rounded-3xl p-5"
                >
                  <p className="text-xs text-[var(--mute)]">{enrollment.course.subject}</p>
                  <h2 className="serif mt-1 text-2xl">{enrollment.course.title}</h2>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full bg-[var(--gold)]" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-[var(--mute)]">
                    {done}/{lessons.length} lessons · {pct}%
                  </p>
                </Link>
              );
            })
          )}
        </section>

        <div className="mt-10 flex items-center justify-between">
          <h2 className="serif text-2xl">Catalog</h2>
          <Link href="/courses" className="text-sm text-[var(--gold)]">
            View all
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {catalog.slice(0, 6).map((course) => (
            <Link key={course.id} href={`/courses/${course.slug}`} className="panel rounded-2xl p-4">
              <span className="text-lg" style={{ color: course.color }}>
                {course.icon}
              </span>
              <p className="mt-2 font-medium">{course.title}</p>
              <p className="text-xs text-[var(--mute)]">{course.subject}</p>
            </Link>
          ))}
        </div>

        {user.badges.length > 0 && (
          <section className="mt-10">
            <h2 className="serif text-2xl">Badges</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {user.badges.map((item) => (
                <span key={item.id} className="rounded-full border border-[var(--line)] px-3 py-1 text-xs text-[var(--gold)]">
                  {item.badge.title}
                </span>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
