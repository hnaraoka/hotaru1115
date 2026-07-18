import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { notifyFailedLogin } from "@/lib/notify";
import { LOGIN_LOCKOUT_MINUTES, MAX_FAILED_LOGIN_ATTEMPTS } from "@/lib/authConstants";

class AccountLockedError extends CredentialsSignin {
  code = "account-locked";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        loginId: {},
        password: {},
      },
      async authorize(credentials) {
        const loginId = typeof credentials?.loginId === "string" ? credentials.loginId.trim() : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";
        if (!loginId || !password) return null;

        const user = await prisma.user.findUnique({ where: { loginId } });
        if (!user || !user.isActive) return null;

        if (user.failedLoginCount >= MAX_FAILED_LOGIN_ATTEMPTS && user.lastFailedAt) {
          const unlockAt = new Date(user.lastFailedAt.getTime() + LOGIN_LOCKOUT_MINUTES * 60 * 1000);
          if (unlockAt > new Date()) {
            throw new AccountLockedError();
          }
        }

        const valid = await bcrypt.compare(password, user.passwordHash);

        if (!valid) {
          const failedLoginCount = user.failedLoginCount + 1;
          await prisma.user.update({
            where: { id: user.id },
            data: { failedLoginCount, lastFailedAt: new Date() },
          });
          if (failedLoginCount === MAX_FAILED_LOGIN_ATTEMPTS) {
            await notifyFailedLogin(user);
          }
          return null;
        }

        if (user.failedLoginCount > 0) {
          await prisma.user.update({ where: { id: user.id }, data: { failedLoginCount: 0 } });
        }

        return { id: user.id, name: user.name, loginId: user.loginId, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.loginId = (user as { loginId: string }).loginId;
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.loginId = token.loginId as string;
        session.user.role = token.role as "ADMIN" | "USER";
      }
      return session;
    },
  },
});
