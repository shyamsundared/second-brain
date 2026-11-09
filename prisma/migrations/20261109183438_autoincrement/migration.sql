-- AlterTable
CREATE SEQUENCE content_id_seq;
ALTER TABLE "Content" ALTER COLUMN "id" SET DEFAULT nextval('content_id_seq');
ALTER SEQUENCE content_id_seq OWNED BY "Content"."id";

-- AlterTable
CREATE SEQUENCE tag_id_seq;
ALTER TABLE "Tag" ALTER COLUMN "id" SET DEFAULT nextval('tag_id_seq');
ALTER SEQUENCE tag_id_seq OWNED BY "Tag"."id";

-- AlterTable
CREATE SEQUENCE user_id_seq;
ALTER TABLE "User" ALTER COLUMN "id" SET DEFAULT nextval('user_id_seq');
ALTER SEQUENCE user_id_seq OWNED BY "User"."id";

-- CreateTable
CREATE TABLE "Link" (
    "id" SERIAL NOT NULL,
    "hash" TEXT NOT NULL,

    CONSTRAINT "Link_pkey" PRIMARY KEY ("id")
);
