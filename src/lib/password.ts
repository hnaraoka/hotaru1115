import { randomInt } from "node:crypto";
import bcrypt from "bcryptjs";

const PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

export function generateInitialPassword(length = 10): string {
  let password = "";
  for (let i = 0; i < length; i++) {
    password += PASSWORD_CHARS[randomInt(PASSWORD_CHARS.length)];
  }
  return password;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}
