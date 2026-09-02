import { prisma } from "@/lib/prisma";

export async function touchStreak(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const now = new Date();
  const last = user.lastActive ? new Date(user.lastActive) : null;
  let streak = user.streak;

  if (!last) {
    streak = 1;
  } else {
    const lastDay = startOfDay(last).getTime();
    const today = startOfDay(now).getTime();
    const diff = Math.round((today - lastDay) / 86_400_000);
    if (diff === 1) streak += 1;
    else if (diff > 1) streak = 1;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { lastActive: now, streak },
  });

  if (streak >= 3) {
    await awardBadge(userId, "three-streak");
  }
}

export async function addXp(userId: string, amount: number) {
  await prisma.user.update({
    where: { id: userId },
    data: { xp: { increment: amount } },
  });
}

export async function awardBadge(userId: string, slug: string) {
  const badge = await prisma.badge.findUnique({ where: { slug } });
  if (!badge) return;
  await prisma.userBadge.upsert({
    where: { userId_badgeId: { userId, badgeId: badge.id } },
    update: {},
    create: { userId, badgeId: badge.id },
  });
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
