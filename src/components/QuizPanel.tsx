"use client";

import { useState } from "react";

type Question = { id: string; prompt: string; choices: string[] };
type Review = {
  prompt: string;
  choices: string[];
  chosen: number;
  correctIndex: number;
  explanation: string;
  ok: boolean;
};

export function QuizPanel({
  quizId,
  title,
  questions,
}: {
  quizId: string;
  title: string;
  questions: Question[];
}) {
  const [answers, setAnswers] = useState<number[]>(Array(questions.length).fill(-1));
  const [result, setResult] = useState<{ score: number; review: Review[] } | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <section className="panel mt-8 rounded-3xl p-6">
      <h2 className="serif text-2xl">{title}</h2>
      <div className="mt-4 space-y-6">
        {questions.map((question, qIndex) => (
          <fieldset key={question.id}>
            <legend className="font-medium">
              {qIndex + 1}. {question.prompt}
            </legend>
            <div className="mt-2 space-y-2">
              {question.choices.map((choice, cIndex) => (
                <label key={choice} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={question.id}
                    disabled={Boolean(result)}
                    onChange={() =>
                      setAnswers((current) => {
                        const next = [...current];
                        next[qIndex] = cIndex;
                        return next;
                      })
                    }
                  />
                  <span>{choice}</span>
                </label>
              ))}
            </div>
            {result && (
              <p className={`mt-2 text-sm ${result.review[qIndex].ok ? "text-emerald-300" : "text-rose-300"}`}>
                {result.review[qIndex].ok ? "Correct. " : "Not quite. "}
                {result.review[qIndex].explanation}
              </p>
            )}
          </fieldset>
        ))}
      </div>
      {!result && (
        <button
          disabled={pending || answers.some((value) => value < 0)}
          onClick={async () => {
            setPending(true);
            const response = await fetch("/api/quiz", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ quizId, answers }),
            });
            const data = await response.json();
            setResult({ score: data.score, review: data.review });
            setPending(false);
          }}
          className="mt-6 rounded-full bg-[var(--gold)] px-4 py-2 text-sm font-medium text-[#08111f] disabled:opacity-50"
        >
          {pending ? "Scoring…" : "Submit quiz"}
        </button>
      )}
      {result && <p className="mt-6 serif text-2xl text-[var(--gold)]">Score: {result.score}%</p>}
    </section>
  );
}
