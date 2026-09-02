import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { addXp, awardBadge, touchStreak } from "@/lib/progress";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const { lessonId, status } = (await req.json()) as {
    lessonId?: string;
    status?: string;
  };
  if (!lessonId) return NextResponse.json({ error: "Missing lesson." }, { status: 400 });

  const completed = status === "completed";
  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: session.user.id, lessonId } },
    update: {
      status: completed ? "completed" : "in_progress",
      completedAt: completed ? new Date() : null,
    },
    create: {
      userId: session.user.id,
      lessonId,
      status: completed ? "completed" : "in_progress",
      completedAt: completed ? new Date() : null,
    },
  });

  if (completed) {
    await addXp(session.user.id, 25);
    await touchStreak(session.user.id);
    const count = await prisma.lessonProgress.count({
      where: { userId: session.user.id, status: "completed" },
    });
    if (count >= 1) await awardBadge(session.user.id, "first-lesson");
  }

  return NextResponse.json({ ok: true });
}
