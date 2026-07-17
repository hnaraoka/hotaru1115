import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const loginId = process.env.SEED_ADMIN_LOGIN_ID ?? "admin";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  const name = process.env.SEED_ADMIN_NAME ?? "管理者";
  const email = process.env.SEED_ADMIN_EMAIL ?? null;

  const existing = await prisma.user.findUnique({ where: { loginId } });
  if (existing) {
    console.log(`管理者アカウント (loginId: ${loginId}) は既に存在します。スキップしました。`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { loginId, name, role: "ADMIN", email, passwordHash },
  });

  console.log("初期管理者アカウントを作成しました。");
  console.log(`  ログインID: ${loginId}`);
  console.log(`  パスワード: ${password}`);
  console.log("ログイン後、必ずパスワードを変更してください。");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
