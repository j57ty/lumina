import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { addXp, awardBadge, touchStreak } from "@/lib/progress";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const { quizId, answers } = (await req.json()) as {
    quizId?: string;
    answers?: number[];
  };
  if (!quizId || !Array.isArray(answers)) {
    return NextResponse.json({ error: "Missing answers." }, { status: 400 });
  }

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { questions: { orderBy: { id: "asc" } } },
  });
  if (!quiz) return NextResponse.json({ error: "Quiz not found." }, { status: 404 });

  let correct = 0;
  const review = quiz.questions.map((question, index) => {
    const chosen = answers[index];
    const ok = chosen === question.answerIndex;
    if (ok) correct += 1;
    return {
      prompt: question.prompt,
      choices: JSON.parse(question.choices) as string[],
      chosen,
      correctIndex: question.answerIndex,
      explanation: question.explanation,
      ok,
    };
  });

  const score = quiz.questions.length
    ? Math.round((correct / quiz.questions.length) * 100)
    : 0;

  await prisma.quizAttempt.create({
    data: {
      userId: session.user.id,
      quizId,
      score,
      answers: JSON.stringify(answers),
    },
  });

  await addXp(session.user.id, Math.max(10, Math.round(score / 5)));
  await touchStreak(session.user.id);
  if (score === 100) await awardBadge(session.user.id, "quiz-ace");

  return NextResponse.json({ score, correct, total: quiz.questions.length, review });
}
