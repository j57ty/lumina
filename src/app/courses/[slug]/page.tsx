import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Nav } from "@/components/Nav";
import { EnrollButton } from "@/components/EnrollButton";

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      units: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            include: { progress: { where: { userId: session?.user?.id ?? "" } } },
          },
        },
      },
    },
  });
  if (!course) notFound();

  const enrolled = session?.user?.id
    ? await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: session.user.id, courseId: course.id } },
      })
    : null;

  return (
    <div>
      <Nav />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <p className="text-xs uppercase tracking-[0.28em] text-[var(--gold)]">{course.subject}</p>
        <h1 className="serif mt-2 text-4xl text-[#f6efe2]">{course.title}</h1>
        <p className="mt-3 text-[var(--mute)]">{course.description}</p>
        <div className="mt-5">
          <EnrollButton courseId={course.id} enrolled={Boolean(enrolled)} />
        </div>
        <div className="mt-10 space-y-8">
          {course.units.map((unit) => (
            <section key={unit.id}>
              <h2 className="serif text-2xl">{unit.title}</h2>
              <p className="mt-1 text-sm text-[var(--mute)]">{unit.description}</p>
              <div className="mt-3 space-y-2">
                {unit.lessons.map((lesson) => {
                  const done = lesson.progress.some((p) => p.status === "completed");
                  return (
                    <Link
                      key={lesson.id}
                      href={`/learn/${lesson.id}`}
                      className="panel flex items-center justify-between rounded-2xl px-4 py-3"
                    >
                      <div>
                        <p className="font-medium">{lesson.title}</p>
                        <p className="text-xs text-[var(--mute)]">
                          {lesson.estimatedMinutes} min · {lesson.summary}
                        </p>
                      </div>
                      <span className="text-xs text-[var(--gold)]">{done ? "Done" : "Open"}</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
