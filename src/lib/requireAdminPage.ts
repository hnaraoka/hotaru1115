import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * Defense-in-depth alongside src/proxy.ts's middleware role gate: /admin/*
 * pages are already blocked for non-admins there, but this repeats the same
 * check at the page level so a page still redirects correctly even if the
 * middleware matcher ever stops covering it.
 */
export async function requireAdminPageSession() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");
  return session;
}
