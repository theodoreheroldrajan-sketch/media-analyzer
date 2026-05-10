"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const steps = [
  { href: "/", label: "Home", step: 0 },
  { href: "/setup", label: "Setup", step: 1 },
  { href: "/instructions", label: "Instructions", step: 2 },
  { href: "/upload", label: "Upload", step: 3 },
  { href: "/mapping", label: "Mapping", step: 4 },
  { href: "/variables", label: "Variables", step: 5 },
  { href: "/analysis", label: "Analysis", step: 6 },
  { href: "/dashboard", label: "Dashboard", step: 7 },
  { href: "/settings", label: "Settings", step: 8 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const currentIndex = steps.findIndex((s) => s.href === pathname);

  return (
    <aside className="w-56 shrink-0 border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 flex flex-col">
      <div className="px-4 py-5 border-b border-zinc-200 dark:border-zinc-800">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          Creative Media Analyser
        </Link>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {steps.map((step) => {
          const isActive = step.href === pathname;
          const isCompleted = currentIndex > step.step;
          const isFuture = currentIndex < step.step && currentIndex !== -1;

          return (
            <Link
              key={step.href}
              href={step.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : isCompleted
                  ? "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
                  : isFuture
                  ? "text-zinc-400 dark:text-zinc-600"
                  : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                  isActive
                    ? "bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white"
                    : isCompleted
                    ? "bg-zinc-300 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300"
                    : "bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500"
                }`}
              >
                {isCompleted ? "✓" : step.step}
              </span>
              {step.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
