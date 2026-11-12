import "dotenv/config";
import express from "express";
import {prisma} from "./lib/prisma.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { JWT_SECRET } from "./config.js";
import auth from "./middleware.js";
import { da } from "zod/locales";
import { randomBytes } from "node:crypto";
const app = express();
app.use(express.json());

app.post("/api/v1/signup", async (req, res) => {
    const {username,password}=req.body;
    const userexists=await prisma.user.findFirst({
        where:{
            username
        }
    })
    if(userexists){
        res.status(409).json({
            message:"user already exists"
        })
    }
    try{
        await prisma.user.create({
        data:{
            username,password
        }
    })
    }
    catch(e){
        res.status(500).json({
            message:'could not create'
        })
    }
  

});

app.post("/api/v1/signin", async (req, res) => {
        const {username,password}=req.body;
        const pass=await bcrypt.hash(password,10);
        try{
        const User=await prisma.user.findFirst({
            where:{
                username
            }
        })
        if(!User){
            return;
        }
        const iseql=bcrypt.compare(User.password,pass);
        if(!iseql){
            res.status(400).json({
                message:"bad inpputs"
            })
            return
        }
        const newId=User.id as unknown as string
        const token=jwt.sign({userId:newId},JWT_SECRET)
        return token;
    }
        catch{
            res.status(404).json({
                message:"user doesnt exist"
            })
            return;
        }
       
});

app.post("/api/v1/content",auth,async (req, res) => {
    const userid=Number(req.userId);
    const {link,type,title,tags}=req.body;
   try{
    const resp=await prisma.content.create({
        data:{
            link,
            type,
            title,
            userId:userid,
           tags: {
          connectOrCreate: (tags ?? []).map((t: string) => ({
            where: { title: t },   // use the tag if it exists
            create: { title: t },  // otherwise create it
          })),
        },
      },
      include: { tags: true },
      
            
        }
    )
    res.status(201).json({resp:resp})}
    catch(e){
        res.status(400).json({
            message:"could not create content"
        })
    }
})


app.get("/api/v1/content",auth, async (req, res) => {
    const userid=Number(req.userId)
    const data=await prisma.content.findMany({
        where:{
            userId:userid
        },
        
    });
    res.json({data})
});

app.delete("/api/v1/:contentid",auth, async(req, res) => {
    const contentid=Number(req.params.contentid);
    const userid=Number(req.userId);
    const data=await prisma.content.delete({
        where:{
            id:contentid,
            userId:userid
        }
    })
});

app.post("/api/v1/brain/share",auth, async (req, res) => {
    const share=req.body.share;
    const userId=Number(req.userId)
    if(share){
        await prisma.link.upsert({
          where:{userId},
          update:{},
          create:{userId,hash:randomBytes(10).toString("hex")}
        })
        res.json({message:"updated sharebale link"})
    }
    else{
        await prisma.link.delete({where:{userId}});
    }
    
});

app.get("/api/v1/brain/:sharelink",async (req, res) => {
    const hash=req.params.sharelink;
    const link=await prisma.link.findFirst({
        where:{
            hash
        }
    })
    if(!link){
        res.status(411).json({
            message:"incorret"
        })
        return
    }
    const cotent=await prisma.content.findFirst({
        where:{
            userId:link.userId
        }
    })
});

const PORT = Number(process.env["PORT"] ?? 3000);
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

