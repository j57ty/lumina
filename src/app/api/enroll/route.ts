import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { awardBadge } from "@/lib/progress";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const { courseId } = (await req.json()) as { courseId?: string };
  if (!courseId) return NextResponse.json({ error: "Missing course." }, { status: 400 });

  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: session.user.id, courseId } },
    update: {},
    create: { userId: session.user.id, courseId },
  });

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: session.user.id },
    include: { course: true },
  });
  const subjects = new Set(enrollments.map((e) => e.course.subject));
  if (subjects.size >= 3) await awardBadge(session.user.id, "polymath");

  return NextResponse.json({ ok: true });
}
