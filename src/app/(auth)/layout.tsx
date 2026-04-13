import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4">
      <section className="w-full rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
        {children}
      </section>
    </main>
  );
}
