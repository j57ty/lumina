# Deploy Lumina

You will put the app on Vercel and the database on Neon. Both have free tiers.

## 1. Run it on your computer first

```bash
cd lumina
cp .env.example .env
openssl rand -base64 32
# paste that value into AUTH_SECRET in .env
npm install
npm run db:setup
npm run dev
```

Confirm you can register, open a course, finish a quiz, and talk to the tutor.

## 2. Create a GitHub repository

```bash
cd lumina
git init
git add .
git commit -m "Lumina high school academy"
```

On github.com click **New repository**, copy the remote URL, then:

```bash
git branch -M main
git remote add origin https://github.com/YOUR_USER/lumina.git
git push -u origin main
```

Do not commit `.env`. It is already gitignored.

## 3. Create a Postgres database (Neon)

1. Go to https://neon.tech and create a project.
2. Copy the connection string. It looks like:
   `postgresql://USER:PASSWORD@HOST/neondb?sslmode=require`

## 4. Point Prisma at Postgres

In `prisma/schema.prisma` change only the datasource provider:

```
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Commit that change.

Locally you can keep using SQLite. For Vercel, `DATABASE_URL` will be the Neon URL.

## 5. Deploy on Vercel

1. Go to https://vercel.com and sign in with GitHub.
2. **Add New → Project** and import the `lumina` repo.
3. Add environment variables:

| Name | Value |
| --- | --- |
| `DATABASE_URL` | Neon connection string |
| `AUTH_SECRET` | a new `openssl rand -base64 32` value |
| `AUTH_URL` | `https://YOUR-PROJECT.vercel.app` |
| `LLM_API_KEY` | your xAI or OpenAI key |
| `LLM_BASE_URL` | `https://api.x.ai/v1` or `https://api.openai.com/v1` |
| `LLM_MODEL` | `grok-4` or `gpt-4o-mini` |

4. Deploy.

5. After the first deploy, open Vercel’s terminal or run from your laptop with the production URL loaded:

```bash
DATABASE_URL="postgresql://..." npx prisma db push
DATABASE_URL="postgresql://..." npx tsx prisma/seed.ts
```

That creates tables and the course catalog on Neon.

6. Visit the Vercel URL. Register a real account. The demo user is also seeded.

## 6. Custom domain (optional)

In Vercel: Project → Settings → Domains. Add `learn.yourdomain.com`. Then set `AUTH_URL` to that https URL and redeploy.

## Notes that matter

- Vercel’s filesystem is ephemeral. Do not use SQLite in production.
- Voice uses the visitor’s browser. No extra paid TTS key is required.
- LLM usage is billed by your model provider. Start with a cheap model if you are testing with a class.
- If login loops after deploy, `AUTH_SECRET` and `AUTH_URL` are the first things to check.
