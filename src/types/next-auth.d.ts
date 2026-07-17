import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      loginId: string;
      role: "ADMIN" | "USER";
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    loginId: string;
    role: "ADMIN" | "USER";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    loginId: string;
    role: "ADMIN" | "USER";
  }
}
