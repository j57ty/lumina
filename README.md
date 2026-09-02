# Lumina

A high-school learning academy: accounts, course catalog, lessons, quizzes, progress, badges, and an agentic tutor that can speak.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS 4
- Prisma + SQLite (local)
- Auth.js (NextAuth v5) credentials
- OpenAI-compatible LLM API for the tutor (xAI or OpenAI)
- Web Speech API for text-to-speech and microphone input

## Local setup

```bash
cd lumina
cp .env.example .env
# edit .env — at minimum set AUTH_SECRET
#   openssl rand -base64 32
npm install
npm run db:setup
npm run dev
```

Open http://localhost:3000

Demo login after seeding: ada@lumina.edu / demo1234

## Tutor voice and tools

- Lessons and tutor replies use the browser speech engine. Chrome is the most reliable for both speak and mic.
- Put an API key in LLM_API_KEY to enable the full agent (curriculum search, lesson lookup, enrollment-aware recommendations).
- Without a key, the tutor still answers using the built-in catalog.

xAI example in .env:

```
LLM_API_KEY=xai-...
LLM_BASE_URL=https://api.x.ai/v1
LLM_MODEL=grok-4
```

## Deploy

See DEPLOY.md. Short version: push to GitHub, create a free Neon Postgres database, switch Prisma to postgresql, deploy on Vercel, add env vars.

## What is seeded

Twenty-one courses across math, science, English, social studies, CS, health, Spanish I, studio art, and personal fitness. Each course has units, written lessons, and check quizzes. The tutor can teach topics that are not fully written out yet. Voice uses the browser: tap Mic to ask, and replies are read aloud when Voice is on.
