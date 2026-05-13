import { redirect } from "next/navigation";

/**
 * Root `/` redirects to the demo. The real app is still accessible via
 * direct URLs (`/setup`, `/dashboard`, etc.) — bookmark them for personal use.
 * This protects against accidental usage by portfolio visitors who would
 * otherwise hit Supabase / Anthropic API budgets.
 */
export default function HomePage() {
  redirect("/demo");
}
