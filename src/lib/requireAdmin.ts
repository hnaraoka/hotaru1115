import { auth } from "@/lib/auth";

export async function requireAdminSession() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
}
