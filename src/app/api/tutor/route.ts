import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { runTutor } from "@/lib/agent";

const bodySchema = z.object({
  message: z.string().min(1).max(4000),
  conversationId: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid message." }, { status: 400 });
  }

  const userId = session.user.id;
  let conversationId = parsed.data.conversationId;

  if (!conversationId) {
    const created = await prisma.conversation.create({
      data: {
        userId,
        title: parsed.data.message.slice(0, 60),
      },
    });
    conversationId = created.id;
  }

  const prior = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: 16,
  });

  await prisma.message.create({
    data: { conversationId, role: "user", content: parsed.data.message },
  });

  try {
    const result = await runTutor({
      userId,
      question: parsed.data.message,
      history: prior
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    });

    await prisma.message.create({
      data: { conversationId, role: "assistant", content: result.reply },
    });

    return NextResponse.json({
      reply: result.reply,
      conversationId,
      usedModel: result.usedModel,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tutor failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
