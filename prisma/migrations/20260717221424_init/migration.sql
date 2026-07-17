-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "RatingLevel" AS ENUM ('EXCELLENT', 'GOOD', 'NORMAL', 'SLIGHTLY_BAD', 'BAD');

-- CreateEnum
CREATE TYPE "TechCategory" AS ENUM ('LANGUAGE', 'FRAMEWORK', 'DATABASE', 'TOOL', 'OS_ENV');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "loginId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
    "lastFailedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "relatedUserId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL,
    "targetYear" INTEGER NOT NULL,
    "targetMonth" INTEGER NOT NULL,
    "gender" TEXT,
    "age" INTEGER,
    "experienceYears" INTEGER,
    "clientCompany" TEXT NOT NULL,
    "workLocation" TEXT NOT NULL,
    "workDays" INTEGER,
    "workHours" DOUBLE PRECISION,
    "teleworkDays" INTEGER,
    "onsiteDays" INTEGER,
    "projectName" TEXT NOT NULL,
    "projectPeriodStartYear" INTEGER,
    "projectPeriodStartMonth" INTEGER,
    "projectPeriodOngoing" BOOLEAN NOT NULL DEFAULT true,
    "projectPeriodEndYear" INTEGER,
    "projectPeriodEndMonth" INTEGER,
    "projectPeriodMonths" INTEGER,
    "workContent" TEXT NOT NULL,
    "devProcesses" TEXT[],
    "deliverables" TEXT,
    "troubles" TEXT,
    "goodPoints" TEXT,
    "condition" "RatingLevel",
    "motivation" "RatingLevel",
    "workload" "RatingLevel",
    "difficulty" "RatingLevel",
    "teamConsultability" "RatingLevel",
    "growth" "RatingLevel",
    "pdfBlobUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechStackItem" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "category" "TechCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TechStackItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkAllocation" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "percentage" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "WorkAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_loginId_key" ON "User"("loginId");

-- CreateIndex
CREATE INDEX "Report_userId_targetYear_targetMonth_idx" ON "Report"("userId", "targetYear", "targetMonth");

-- CreateIndex
CREATE UNIQUE INDEX "Report_userId_targetYear_targetMonth_key" ON "Report"("userId", "targetYear", "targetMonth");

-- CreateIndex
CREATE INDEX "TechStackItem_reportId_idx" ON "TechStackItem"("reportId");

-- CreateIndex
CREATE INDEX "WorkAllocation_reportId_idx" ON "WorkAllocation"("reportId");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_relatedUserId_fkey" FOREIGN KEY ("relatedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechStackItem" ADD CONSTRAINT "TechStackItem_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkAllocation" ADD CONSTRAINT "WorkAllocation_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;
