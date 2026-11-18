import "dotenv/config";
import express, { type Response } from "express";
import type { ZodError } from "zod";
import {prisma} from "./lib/prisma.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { JWT_SECRET, TOKEN_EXPIRY } from "./config.js";
import auth from "./middleware.js";
import { randomBytes } from "node:crypto";
import { getLinkText } from "./ingest/linkText.js";
import { embed, saveEmbedding, toVector } from "./ingest/embed.js";
import { contentSchema, shareSchema, signinSchema, signupSchema } from "./types.js";
const app = express();
app.use(express.json());

// Send the first validation problem back as a readable message, e.g. "password: must be at least 6 characters"
function badRequest(res: Response, error: ZodError){
    const issue=error.issues[0];
    res.status(400).json({ message: issue ? `${issue.path.join(".") || "body"}: ${issue.message}` : "invalid input" });
}

// A user's content for cards: no `text` (transcripts can be huge), tags as plain names
async function listContents(userId:number){
    const contents=await prisma.content.findMany({
        where:{ userId },
        select:{ id:true, link:true, type:true, title:true, tags:{ select:{ title:true } } },
        orderBy:{ id:"desc" },
    });
    return contents.map(c=>({ ...c, tags:c.tags.map(t=>t.title) }));
}

app.post("/api/v1/signup", async (req, res) => {
    const parsed=signupSchema.safeParse(req.body);
    if(!parsed.success) return badRequest(res, parsed.error);
    const {username,password}=parsed.data;

    const userexists=await prisma.user.findUnique({ where:{ username } })
    if(userexists){
        res.status(409).json({
            message:"user already exists"
        })
        return;
    }
    const hashedpassword=await bcrypt.hash(password,10);
    await prisma.user.create({
        data:{
            username,password:hashedpassword
        }
    })
    res.status(201).json({message:'signup successful'})
});

app.post("/api/v1/signin", async (req, res) => {
    const parsed=signinSchema.safeParse(req.body);
    if(!parsed.success) return badRequest(res, parsed.error);
    const {username,password}=parsed.data;

    const User=await prisma.user.findUnique({ where:{ username } })
    // Same answer for "no such user" and "wrong password", so usernames can't be guessed
    if(!User || !(await bcrypt.compare(password,User.password))){
        res.status(401).json({message:"wrong username or password"})
        return;
    }
    const token=jwt.sign({userId:User.id},JWT_SECRET,{ expiresIn:TOKEN_EXPIRY })
    res.json({token})
});

app.post("/api/v1/content",auth,async (req, res) => {
    const parsed=contentSchema.safeParse(req.body);
    if(!parsed.success) return badRequest(res, parsed.error);
    const {link,type,title,tags}=parsed.data;
    const userid=req.userId;
    // " React", "react" and "react " should all be the same tag
    const tagNames=[...new Set(tags.map(t=>t.trim().toLowerCase()).filter(Boolean))];

    // Fetch searchable text (tweet text / video description / transcript). Never blocks the save.
    const info=await getLinkText(link);
    const content=await prisma.content.create({
        data:{
            link,
            type,
            title: title || info?.title || link,
            text: info?.text ?? null,
            userId:userid,
            tags: {
                connectOrCreate: tagNames.map((t) => ({
                    where: { title: t },   // use the tag if it exists
                    create: { title: t },  // otherwise create it
                })),
            },
        },
        include: { tags: true },
    });

    // Embedding powers semantic search and "similar" items. If it fails, keyword search still works.
    try{
        await saveEmbedding(content.id, content.title, content.text);
    }catch(e){
        console.error(`could not embed content #${content.id}:`, e);
    }

    const { text: _text, ...rest }=content;
    res.status(201).json({ content:{ ...rest, tags:content.tags.map(t=>t.title) } });
})

app.get("/api/v1/content",auth, async (req, res) => {
    res.json({ data: await listContents(req.userId) });
});

app.delete("/api/v1/content/:id",auth, async(req, res) => {
    const id=Number(req.params.id);
    // deleteMany with userId, so users can only delete their own content
    const { count }=await prisma.content.deleteMany({ where:{ id, userId:req.userId } });
    if(count===0){
        res.status(404).json({message:"content not found"});
        return;
    }
    res.json({message:"deleted"});
});

// Hybrid search: keyword matches + meaning matches, merged with Reciprocal Rank Fusion.
// Each list gives a rank; an item scores 1/(60 + rank) per list it appears in, so
// items found by both rank highest, and items found by only one still show up.
app.get("/api/v1/search",auth, async (req, res) => {
    const userId=req.userId;
    const q=String(req.query["q"] ?? "").trim().slice(0, 200);
    if(!q){
        res.status(400).json({message:"q is required"});
        return;
    }
    // If embedding fails the vector is NULL, the meaning half finds nothing, and keyword search still works
    const queryVector=await embed(q).then(toVector).catch(()=>null);

    // _ContentToTag is Prisma's join table: "A" = Content.id, "B" = Tag.id
    const results=await prisma.$queryRaw`
        WITH keyword AS (
            SELECT c.id, ROW_NUMBER() OVER (ORDER BY ts_rank(
                to_tsvector('english', c.title || ' ' || coalesce(c.text, '')),
                websearch_to_tsquery('english', ${q})) DESC) AS rank
            FROM "Content" c
            WHERE c."userId" = ${userId}
              AND (
                to_tsvector('english', c.title || ' ' || coalesce(c.text, '')) @@ websearch_to_tsquery('english', ${q})
                OR c.title ILIKE ${"%" + q + "%"}
                OR EXISTS (SELECT 1 FROM "_ContentToTag" ct JOIN "Tag" t ON t.id = ct."B" WHERE ct."A" = c.id AND t.title ILIKE ${q})
              )
            ORDER BY rank LIMIT 20
        ),
        meaning AS (
            SELECT c.id, ROW_NUMBER() OVER (ORDER BY c.embedding <=> ${queryVector}::vector) AS rank
            FROM "Content" c
            WHERE c."userId" = ${userId}
              AND c.embedding IS NOT NULL
              -- <=> is cosine distance (0 = same meaning). Similarity below 0.25 is unrelated for this model.
              AND 1 - (c.embedding <=> ${queryVector}::vector) > 0.25
            ORDER BY rank LIMIT 20
        ),
        fused AS (
            SELECT id, SUM(1.0 / (60 + rank)) AS score
            FROM (SELECT * FROM keyword UNION ALL SELECT * FROM meaning) both_lists
            GROUP BY id
        )
        SELECT c.id, c.link, c.type, c.title,
               ARRAY(SELECT t.title FROM "_ContentToTag" ct JOIN "Tag" t ON t.id = ct."B" WHERE ct."A" = c.id) AS tags
        FROM fused f JOIN "Content" c ON c.id = f.id
        ORDER BY f.score DESC
        LIMIT 20`;
    res.json({results});
});

// Other saved items closest in meaning to this one
app.get("/api/v1/content/:id/related",auth, async (req, res) => {
    const id=Number(req.params.id);
    const userId=req.userId;
    const results=await prisma.$queryRaw`
        SELECT c.id, c.link, c.type, c.title,
               ARRAY(SELECT t.title FROM "_ContentToTag" ct JOIN "Tag" t ON t.id = ct."B" WHERE ct."A" = c.id) AS tags
        FROM "Content" c,
             (SELECT embedding FROM "Content" WHERE id = ${id} AND "userId" = ${userId}) source
        WHERE c."userId" = ${userId}
          AND c.id <> ${id}
          AND c.embedding IS NOT NULL
          AND 1 - (c.embedding <=> source.embedding) > 0.3
        ORDER BY c.embedding <=> source.embedding
        LIMIT 5`;
    res.json({results});
});

// Current share link (null when not shared), so the UI can show it on load
app.get("/api/v1/brain/share",auth, async (req, res) => {
    const link=await prisma.link.findUnique({ where:{ userId:req.userId } });
    res.json({ hash: link?.hash ?? null });
});

app.post("/api/v1/brain/share",auth, async (req, res) => {
    const parsed=shareSchema.safeParse(req.body);
    if(!parsed.success) return badRequest(res, parsed.error);
    const userId=req.userId;

    if(parsed.data.share){
        // Reuse the existing link if there is one, so old shared URLs keep working
        const link=await prisma.link.upsert({
            where:{userId},
            update:{},
            create:{userId,hash:randomBytes(10).toString("hex")}
        })
        res.json({ hash: link.hash })
        return;
    }
    await prisma.link.deleteMany({ where:{ userId } });
    res.json({ hash: null });
});

// Public: anyone with the link can view (no auth)
app.get("/api/v1/brain/:hash",async (req, res) => {
    const link=await prisma.link.findFirst({
        where:{ hash:req.params.hash },
        include:{ user:{ select:{ username:true } } },
    })
    if(!link){
        res.status(404).json({ message:"this share link doesn't exist or was turned off" })
        return
    }
    res.json({ username: link.user.username, data: await listContents(link.userId) });
});

const PORT = Number(process.env["PORT"] ?? 3000);
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  // Load the embedding model now, so the first save/search isn't slow
  embed("warm up").catch((e) => console.error("could not load embedding model:", e));
});
