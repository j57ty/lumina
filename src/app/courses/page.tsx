import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Nav } from "@/components/Nav";

export default async function CoursesPage() {
  const courses = await prisma.course.findMany({
    orderBy: [{ subject: "asc" }, { title: "asc" }],
    include: { units: { include: { lessons: true } } },
  });
  const subjects = Array.from(new Set(courses.map((c) => c.subject)));

  return (
    <div>
      <Nav />
      <main className="mx-auto max-w-6xl px-5 py-10">
        <p className="text-xs uppercase tracking-[0.28em] text-[var(--gold)]">Catalog</p>
        <h1 className="serif mt-2 text-4xl text-[#f6efe2]">The academy</h1>
        <p className="mt-2 max-w-2xl text-[var(--mute)]">
          Core high-school subjects. Each course has units, lessons, and a check quiz. The tutor can
          teach beyond the written pages.
        </p>
        {subjects.map((subject) => (
          <section key={subject} className="mt-10">
            <h2 className="serif text-2xl">{subject}</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {courses
                .filter((course) => course.subject === subject)
                .map((course) => {
                  const lessonCount = course.units.reduce((n, unit) => n + unit.lessons.length, 0);
                  return (
                    <Link key={course.id} href={`/courses/${course.slug}`} className="panel rounded-3xl p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="serif text-2xl">{course.title}</h3>
                          <p className="mt-1 text-sm text-[var(--mute)]">{course.gradeBand}</p>
                        </div>
                        <span className="text-xl" style={{ color: course.color }}>
                          {course.icon}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-[var(--mist)]">{course.description}</p>
                      <p className="mt-4 text-xs text-[var(--mute)]">
                        {course.units.length} units · {lessonCount} lessons
                      </p>
                    </Link>
                  );
                })}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
