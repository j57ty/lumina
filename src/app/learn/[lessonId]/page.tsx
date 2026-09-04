import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Nav } from "@/components/Nav";
import { renderLesson } from "@/lib/markdown";
import { LessonActions } from "@/components/LessonActions";
import { QuizPanel } from "@/components/QuizPanel";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  await auth();
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      unit: { include: { course: true } },
      quiz: { include: { questions: { orderBy: { id: "asc" } } } },
    },
  });
  if (!lesson) notFound();

  const siblings = await prisma.lesson.findMany({
    where: { unitId: lesson.unitId },
    orderBy: { order: "asc" },
    select: { id: true, title: true, order: true },
  });
  const index = siblings.findIndex((item) => item.id === lesson.id);
  const prev = siblings[index - 1];
  const next = siblings[index + 1];

  return (
    <div>
      <Nav />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <Link href={`/courses/${lesson.unit.course.slug}`} className="text-xs text-[var(--gold)]">
          ← {lesson.unit.course.title}
        </Link>
        <p className="mt-3 text-xs uppercase tracking-[0.2em] text-[var(--mute)]">{lesson.unit.title}</p>
        <h1 className="serif mt-2 text-4xl text-[#f6efe2]">{lesson.title}</h1>
        <p className="mt-2 text-[var(--mute)]">
          {lesson.estimatedMinutes} min · {lesson.summary}
        </p>
        <LessonActions lessonId={lesson.id} text={`${lesson.title}. ${lesson.summary}. ${lesson.content}`} />
        <article
          className="prose-lesson panel mt-8 rounded-3xl p-6 md:p-8"
          dangerouslySetInnerHTML={{ __html: renderLesson(lesson.content) }}
        />
        {lesson.quiz && (
          <QuizPanel
            quizId={lesson.quiz.id}
            title={lesson.quiz.title}
            questions={lesson.quiz.questions.map((q) => ({
              id: q.id,
              prompt: q.prompt,
              choices: JSON.parse(q.choices) as string[],
            }))}
          />
        )}
        <div className="mt-8 flex justify-between text-sm text-[var(--gold)]">
          {prev ? <Link href={`/learn/${prev.id}`}>← {prev.title}</Link> : <span />}
          {next ? <Link href={`/learn/${next.id}`}>{next.title} →</Link> : <span />}
        </div>
        <p className="mt-6 text-sm text-[var(--mute)]">
          Stuck?{" "}
          <Link href={`/tutor?q=${encodeURIComponent("Help me with " + lesson.title)}`} className="text-[var(--gold)]">
            Ask the tutor about this lesson
          </Link>
        </p>
      </main>
    </div>
  );
}
