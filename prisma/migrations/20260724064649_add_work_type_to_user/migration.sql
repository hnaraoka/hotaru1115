-- CreateEnum
CREATE TYPE "WorkType" AS ENUM ('ENGINEER', 'OFFICE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "workType" "WorkType" NOT NULL DEFAULT 'ENGINEER';
