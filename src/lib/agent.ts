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
  let lessons = await prisma.lesson.findMany({
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

  if (lessons.length === 0) {
    const stopwords = new Set([
      "teach", "me", "about", "what", "is", "explain", "how", "to", "the", "a",
      "an", "for", "in", "like", "im", "i'm", "first", "time", "help", "with", "show",
    ]);
    const words = q
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopwords.has(w));

    if (words.length > 0) {
      lessons = await prisma.lesson.findMany({
        where: {
          OR: words.flatMap((w) => [
            { title: { contains: w, mode: "insensitive" } },
            { summary: { contains: w, mode: "insensitive" } },
            { content: { contains: w, mode: "insensitive" } },
            { unit: { title: { contains: w, mode: "insensitive" } } },
            { unit: { course: { title: { contains: w, mode: "insensitive" } } } },
            { unit: { course: { subject: { contains: w, mode: "insensitive" } } } },
          ]),
        },
        take: 8,
        include: { unit: { include: { course: true } } },
      });
    }
  }

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
        include: {
          unit: {
            include: {
              course: true,
              lessons: { select: { id: true, title: true, summary: true } },
            },
          },
          quiz: { include: { questions: { orderBy: { id: "asc" } } } },
        },
      })
    : title
      ? await prisma.lesson.findFirst({
          where: { title: { contains: title, mode: "insensitive" } },
          include: {
            unit: {
              include: {
                course: true,
                lessons: { select: { id: true, title: true, summary: true } },
              },
            },
            quiz: { include: { questions: { orderBy: { id: "asc" } } } },
          },
        })
      : null;
  if (!lesson) return { error: "Lesson not found." };
  return {
    lessonId: lesson.id,
    title: lesson.title,
    course: lesson.unit.course.title,
    subject: lesson.unit.course.subject,
    unitTitle: lesson.unit.title,
    unitDescription: lesson.unit.description,
    summary: lesson.summary,
    content: lesson.content,
    quizTitle: lesson.quiz?.title,
    practiceQuestions:
      lesson.quiz?.questions.map((q) => ({
        prompt: q.prompt,
        explanation: q.explanation,
      })) ?? [],
    unitLessons: lesson.unit.lessons,
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

async function localTutor(question: string) {
  const hits = await searchCurriculum(question);
  if (hits.length > 0) {
    const lesson = await getLesson(hits[0].lessonId);
    if ("content" in lesson && lesson.content) {
      const parts: string[] = [];

      parts.push(`# ${lesson.course}: ${lesson.title}`);
      if (lesson.unitTitle) {
        parts.push(`*Subject: ${lesson.subject} | Unit: ${lesson.unitTitle}*`);
      }
      if (lesson.summary) {
        parts.push(`\n**Summary**: ${lesson.summary}\n`);
      }

      parts.push(`## Comprehensive Lesson Guide & Core Concepts`);
      parts.push(lesson.content);

      if (lesson.practiceQuestions && lesson.practiceQuestions.length > 0) {
        parts.push(`\n## In-Depth Analysis & Worked Application Problems`);
        for (const [idx, q] of lesson.practiceQuestions.entries()) {
          parts.push(`### Problem ${idx + 1}: ${q.prompt}`);
          parts.push(`**Step-by-Step Breakdown & Explanation**:\n${q.explanation}\n`);
        }
      }

      if (lesson.unitLessons && lesson.unitLessons.length > 1) {
        parts.push(`## Key Subtopics Covered in this Unit`);
        for (const sibling of lesson.unitLessons) {
          parts.push(`- **${sibling.title}**: ${sibling.summary}`);
        }
      }

      parts.push(`\n---\n📖 *Open the full lesson, interactive diagrams & practice quiz at ${lesson.href}*`);
      return parts.join("\n");
    }
  }

  return [
    "I searched the academy curriculum, but couldn't find a direct lesson for that specific topic.",
    "",
    "To explore in-depth lessons with step-by-step worked examples, try asking about:",
    "- **Mathematics**: Linear equations, slope as rate of change, inequalities, quadratic formula, Pythagorean theorem, unit circle trigonometry",
    "- **Sciences**: Photosynthesis, cellular respiration, Mendelian genetics, atomic models, Newton's laws of motion",
    "- **Social Studies**: The Constitution & Bill of Rights, American Revolution, Industrial Revolution, World War I & II",
    "- **Computer Science**: Python fundamentals, variables and conditionals, loops, functions, algorithms",
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
    return { reply: await localTutor(question), usedModel: false };
  }

  const system = `You are Lumina, an expert academy tutor for high-school students.
Your goal is to provide thorough, in-depth, and well-structured explanations that deeply explore the topic and touch each specific component requested.
Do not give shallow or brief one-paragraph answers. Instead:
1. Intuitive Foundation: Explain the core concept in clear, relatable terms, highlighting why it works and why it matters.
2. Step-by-Step Breakdown: Break down the topic into its distinct parts, mechanisms, mathematical definitions, or stages.
3. Detailed Worked Examples: Walk through concrete, practical problems step by step, explaining the reasoning behind every calculation or logical transition.
4. Pitfalls & Nuances: Point out common misconceptions, edge cases, and typical student mistakes.
Use tools when you need catalog facts, lesson text, or curriculum context.
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
        return { reply: await localTutor(question), usedModel: false };
      }

      const data = await response.json();
      const choice = data.choices?.[0]?.message;
      if (!choice) return { reply: await localTutor(question), usedModel: false };

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
    return { reply: await localTutor(question), usedModel: false };
  }
}
