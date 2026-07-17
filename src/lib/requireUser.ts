import { auth } from "@/lib/auth";

export async function requireUserSession() {
  const session = await auth();
  if (!session?.user) return null;
  return session;
}
