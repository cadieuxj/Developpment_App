import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm">
        <h1 className="text-4xl font-bold mb-4 text-center">Sovereign AI</h1>
        <p className="text-center text-muted-foreground">
          AI-Native IDE and Development Platform
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/sign-in"
            className="inline-flex items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium"
          >
            Create account
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Database Schema</h2>
            <p className="text-sm text-muted-foreground">
              Multi-tenant PostgreSQL schema with Drizzle ORM ready
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Data Access Layer</h2>
            <p className="text-sm text-muted-foreground">
              Type-safe DAL with tenant isolation built-in
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Next.js 15</h2>
            <p className="text-sm text-muted-foreground">
              App Router with React Server Components
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Ready for Phase 2</h2>
            <p className="text-sm text-muted-foreground">
              Monaco Editor and E2B Sandbox integration next
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
