import type{ Response,Request,NextFunction } from "express"
import jwt from "jsonwebtoken"
import { JWT_SECRET } from "./config.js";
export default function auth(req:Request,res:Response,next:NextFunction){
    const token=req.headers["authorization"]
    if(!token){
        return
    }
    if(typeof token!=="string"){
        res.status(401).json({messsfe:"invalid"})
        return;
    }
    try{
    const decoded=jwt.verify(token,JWT_SECRET);
    if(typeof decoded ==="string"){
         res.status(401).json({messsfe:"invalid"})
        return;
      
    }
    req.userId=decoded.userId;next();}
    catch{
        res.status(401).json({msg:"token tampered"})
        return;
    }
    


}