import type{ Response,Request,NextFunction } from "express"
import jwt from "jsonwebtoken"
import { JWT_SECRET } from "./config.js";
export default function auth(req:Request,res:Response,next:NextFunction){
    const token=req.headers["authorization"]
    if(!token){
        return
    }
    if(typeof token!=="string"){
        return;
    }
    try{
    const decoded=jwt.verify(token,JWT_SECRET);
    if(typeof decoded ==="string"){
        return;
    }
    req.userId=decoded.userId;}
    catch{
        res.json({msg:"token tampered"})
        return;
    }
    next();


}