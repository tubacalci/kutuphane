"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Header } from "@/components/layout/header";

const HIDDEN_HEADER_PATHS = new Set(["/sign-in", "/sign-up"]);

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const showHeader = !HIDDEN_HEADER_PATHS.has(pathname);

  return (
    <>
      {showHeader && <Header />}
      {children}
    </>
  );
}
