-- CreateEnum
CREATE TYPE "PullRequestStatus" AS ENUM ('draft', 'review', 'fixing', 'merged', 'closed');

-- CreateTable
CREATE TABLE "PullRequestShare" (
    "id" UUID NOT NULL,
    "teamId" UUID NOT NULL,
    "taskId" UUID,
    "title" VARCHAR(200) NOT NULL,
    "url" VARCHAR(2048) NOT NULL,
    "assigneeId" UUID,
    "status" "PullRequestStatus" NOT NULL DEFAULT 'draft',
    "memo" VARCHAR(5000),
    "createdById" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PullRequestShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PullRequestShare_teamId_updatedAt_id_idx" ON "PullRequestShare"("teamId", "updatedAt", "id");

-- CreateIndex
CREATE INDEX "PullRequestShare_taskId_idx" ON "PullRequestShare"("taskId");

-- CreateIndex
CREATE INDEX "PullRequestShare_assigneeId_idx" ON "PullRequestShare"("assigneeId");

-- CreateIndex
CREATE INDEX "PullRequestShare_createdById_idx" ON "PullRequestShare"("createdById");

-- AddForeignKey
ALTER TABLE "PullRequestShare" ADD CONSTRAINT "PullRequestShare_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PullRequestShare" ADD CONSTRAINT "PullRequestShare_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PullRequestShare" ADD CONSTRAINT "PullRequestShare_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PullRequestShare" ADD CONSTRAINT "PullRequestShare_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
