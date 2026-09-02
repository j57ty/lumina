import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Nav } from "@/components/Nav";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");

  return (
    <div>
      <Nav />
      <main className="mx-auto max-w-lg px-5 py-10">
        <h1 className="serif text-4xl text-[#f6efe2]">Profile</h1>
        <div className="panel mt-6 space-y-3 rounded-3xl p-6 text-sm">
          <p>
            <span className="text-[var(--mute)]">Name</span>
            <br />
            {user.name}
          </p>
          <p>
            <span className="text-[var(--mute)]">Email</span>
            <br />
            {user.email}
          </p>
          <p>
            <span className="text-[var(--mute)]">Grade</span>
            <br />
            {user.gradeLevel}
          </p>
          <p>
            <span className="text-[var(--mute)]">XP / streak</span>
            <br />
            {user.xp} XP · {user.streak} days
          </p>
        </div>
      </main>
    </div>
  );
}
