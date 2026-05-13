"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDemo } from "@/context/demo-context";

/** Wrap demo pages that require a mode to be set. Redirects to /demo if missing. */
export default function DemoModeGuard({ children }: { children: React.ReactNode }) {
  const { mode, isReady } = useDemo();
  const router = useRouter();

  useEffect(() => {
    if (isReady && !mode) {
      router.replace("/demo");
    }
  }, [isReady, mode, router]);

  if (!isReady) return null;
  if (!mode) return null;

  return <>{children}</>;
}
