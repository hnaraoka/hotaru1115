-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "driveFileId" TEXT,
ADD COLUMN     "driveFileUrl" TEXT,
ADD COLUMN     "driveUploadedAt" TIMESTAMP(3),
ADD COLUMN     "driveUploadError" TEXT;
