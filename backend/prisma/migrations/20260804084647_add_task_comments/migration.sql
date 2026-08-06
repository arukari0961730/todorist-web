-- CreateTable
CREATE TABLE "TaskComment" (
    "id" UUID NOT NULL,
    "taskId" UUID NOT NULL,
    "userId" UUID,
    "message" VARCHAR(2000) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaskComment_taskId_createdAt_id_idx" ON "TaskComment"("taskId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "TaskComment_userId_idx" ON "TaskComment"("userId");

-- AddForeignKey
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
