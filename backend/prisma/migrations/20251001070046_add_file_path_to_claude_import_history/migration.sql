/*
  Warnings:

  - Added the required column `file_path` to the `claude_import_history` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "claude_import_history" ADD COLUMN     "file_path" TEXT NOT NULL;
