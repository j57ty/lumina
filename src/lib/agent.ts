import { prisma } from "@/lib/prisma";

type ChatMessage = { role: "system" | "user" | "assistant" | "tool"; content: string; name?: string };

const tools = [
  {
    type: "function",
    function: {
      name: "search_curriculum",
      description: "Search Lumina courses and lessons by topic or keyword.",
      parameters: {
        type: "object",
        properties: { query: { type: "string" } },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_lesson",
      description: "Load the full text of a lesson by id or title.",
      parameters: {
        type: "object",
        properties: {
          lessonId: { type: "string" },
          title: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_enrolled_courses",
      description: "List the signed-in student's enrolled courses and progress.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "recommend_next",
      description: "Recommend the next lesson for this student.",
      parameters: { type: "object", properties: {} },
    },
  },
];

async function searchCurriculum(query: string) {
  const q = query.trim();
  const lessons = await prisma.lesson.findMany({
    where: {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { summary: { contains: q, mode: "insensitive" } },
        { content: { contains: q, mode: "insensitive" } },
        { unit: { title: { contains: q, mode: "insensitive" } } },
        { unit: { course: { title: { contains: q, mode: "insensitive" } } } },
        { unit: { course: { subject: { contains: q, mode: "insensitive" } } } },
      ],
    },
    take: 8,
    include: { unit: { include: { course: true } } },
  });
  return lessons.map((lesson) => ({
    lessonId: lesson.id,
    title: lesson.title,
    summary: lesson.summary,
    course: lesson.unit.course.title,
    subject: lesson.unit.course.subject,
    href: `/learn/${lesson.id}`,
  }));
}

async function getLesson(lessonId?: string, title?: string) {
  const lesson = lessonId
    ? await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: { unit: { include: { course: true } }, quiz: { include: { questions: true } } },
      })
    : title
      ? await prisma.lesson.findFirst({
          where: { title: { contains: title, mode: "insensitive" } },
          include: { unit: { include: { course: true } }, quiz: { include: { questions: true } } },
        })
      : null;
  if (!lesson) return { error: "Lesson not found." };
  return {
    lessonId: lesson.id,
    title: lesson.title,
    course: lesson.unit.course.title,
    content: lesson.content,
    quizTitle: lesson.quiz?.title,
    practicePrompts: lesson.quiz?.questions.map((q) => q.prompt) ?? [],
    href: `/learn/${lesson.id}`,
  };
}

async function listEnrolled(userId: string) {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    include: {
      course: {
        include: {
          units: { include: { lessons: { include: { progress: { where: { userId } } } } } },
        },
      },
    },
  });
  return enrollments.map((enrollment) => {
    const lessons = enrollment.course.units.flatMap((unit) => unit.lessons);
    const done = lessons.filter((lesson) =>
      lesson.progress.some((p) => p.status === "completed"),
    ).length;
    return {
      title: enrollment.course.title,
      subject: enrollment.course.subject,
      slug: enrollment.course.slug,
      completedLessons: done,
      totalLessons: lessons.length,
    };
  });
}

async function recommendNext(userId: string) {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    include: {
      course: {
        include: {
          units: {
            orderBy: { order: "asc" },
            include: {
              lessons: {
                orderBy: { order: "asc" },
                include: { progress: { where: { userId } } },
              },
            },
          },
        },
      },
    },
  });

  for (const enrollment of enrollments) {
    for (const unit of enrollment.course.units) {
      for (const lesson of unit.lessons) {
        const done = lesson.progress.some((p) => p.status === "completed");
        if (!done) {
          return {
            lessonId: lesson.id,
            title: lesson.title,
            course: enrollment.course.title,
            summary: lesson.summary,
            href: `/learn/${lesson.id}`,
          };
        }
      }
    }
  }

  const fallback = await prisma.lesson.findFirst({
    include: { unit: { include: { course: true } } },
    orderBy: { title: "asc" },
  });
  if (!fallback) return { message: "Catalog is empty." };
  return {
    lessonId: fallback.id,
    title: fallback.title,
    course: fallback.unit.course.title,
    summary: fallback.summary,
    href: `/learn/${fallback.id}`,
    note: "Student has no incomplete enrolled lessons. Suggesting a catalog lesson.",
  };
}

async function runTool(name: string, rawArgs: string, userId: string) {
  const args = rawArgs ? JSON.parse(rawArgs) : {};
  if (name === "search_curriculum") return searchCurriculum(String(args.query ?? ""));
  if (name === "get_lesson") return getLesson(args.lessonId, args.title);
  if (name === "list_enrolled_courses") return listEnrolled(userId);
  if (name === "recommend_next") return recommendNext(userId);
  return { error: `Unknown tool ${name}` };
}

async function localTutor(question: string, catalogHint: string) {
  const hits = await searchCurriculum(question);
  let excerpt = "";
  if (hits[0]) {
    const lesson = await getLesson(hits[0].lessonId);
    if ("content" in lesson && lesson.content) {
      excerpt = `\nClosest lesson: ${lesson.course} — ${lesson.title}\n${String(lesson.content).slice(0, 900)}\nOpen it at ${lesson.href}`;
    }
  }
  return [
    "Lumina tutor (catalog mode — add LLM_API_KEY for the full agent).",
    catalogHint,
    excerpt,
    "",
    "How to work this:",
    "1. Say which course it belongs to.",
    "2. Write one sentence of what you already know.",
    "3. Try one small step before asking for the final answer.",
    "",
    `Your question: ${question}`,
  ].join("\n");
}

export async function runTutor(options: {
  userId: string;
  question: string;
  history: { role: "user" | "assistant"; content: string }[];
}): Promise<{ reply: string; usedModel: boolean }> {
  const { userId, question, history } = options;

  const hits = await searchCurriculum(question);
  const catalogHint =
    hits.length > 0
      ? `Related lessons: ${hits.map((h) => `${h.course} — ${h.title}`).join("; ")}.`
      : "I did not find a close catalog match, so I will reason from general high-school knowledge.";

  const apiKey = process.env.LLM_API_KEY;
  const baseUrl = (process.env.LLM_BASE_URL || "https://api.x.ai/v1").replace(/\/$/, "");
  const model = process.env.LLM_MODEL || "grok-4";

  if (!apiKey) {
    return { reply: await localTutor(question, catalogHint), usedModel: false };
  }

  const system = `You are Lumina, an agentic tutor for high-school students.
Speak clearly. Prefer short paragraphs and worked examples.
Do not dump the full answer to a quiz question immediately — coach first, then reveal.
Use tools when you need catalog facts, lesson text, or a student's next step.
You may discuss any high-school subject. If you are unsure, say so.
Current catalog hint: ${catalogHint}`;

  const messages: ChatMessage[] = [
    { role: "system", content: system },
    ...history.slice(-8),
    { role: "user", content: question },
  ];

  try {
    for (let step = 0; step < 4; step += 1) {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature: 0.4,
          messages,
          tools,
          tool_choice: "auto",
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error(`LLM error ${response.status}: ${text.slice(0, 400)}`);
        return { reply: await localTutor(question, catalogHint), usedModel: false };
      }

      const data = await response.json();
      const choice = data.choices?.[0]?.message;
      if (!choice) return { reply: await localTutor(question, catalogHint), usedModel: false };

    const toolCalls = choice.tool_calls as
      | { id: string; function: { name: string; arguments: string } }[]
      | undefined;

    if (toolCalls && toolCalls.length > 0) {
      messages.push({
        role: "assistant",
        content: choice.content || "",
      });
      // Keep a readable transcript; most OpenAI-compatible APIs want tool call messages echoed.
      (messages[messages.length - 1] as ChatMessage & { tool_calls?: unknown }).tool_calls = toolCalls;

      for (const call of toolCalls) {
        const result = await runTool(call.function.name, call.function.arguments, userId);
        messages.push({
          role: "tool",
          name: call.function.name,
          content: JSON.stringify(result),
        });
        (messages[messages.length - 1] as ChatMessage & { tool_call_id?: string }).tool_call_id =
          call.id;
      }
      continue;
    }

    const reply = String(choice.content || "").trim();
    if (reply) return { reply, usedModel: true };
  }

    return {
      reply: "I ran out of reasoning steps. Ask that again in a smaller piece.",
      usedModel: true,
    };
  } catch (error) {
    console.error("LLM execution error:", error);
    return { reply: await localTutor(question, catalogHint), usedModel: false };
  }
}
