-- CreateEnum
CREATE TYPE "modeltypes" AS ENUM ('image', 'video', 'article', 'audio');

-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "contentid" INTEGER NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Content" (
    "id" INTEGER NOT NULL,
    "link" TEXT NOT NULL,
    "type" "modeltypes" NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "Content_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_title_key" ON "Tag"("title");

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_contentid_fkey" FOREIGN KEY ("contentid") REFERENCES "Content"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
