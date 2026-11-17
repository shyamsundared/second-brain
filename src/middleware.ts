import type{ Response,Request,NextFunction } from "express"
import jwt from "jsonwebtoken"
import { JWT_SECRET } from "./config.js";
export default function auth(req:Request,res:Response,next:NextFunction){
    const token=req.headers["authorization"]
    if(!token){
        res.status(401).json({message:"missing token"})
        return
    }
    try{
    const decoded=jwt.verify(token,JWT_SECRET);
    if(typeof decoded ==="string"){
        res.status(401).json({message:"invalid token"})
        return;
    }
    req.userId=decoded.userId;next();}
    catch{
        res.status(401).json({message:"invalid token"})
        return;
    }
}
