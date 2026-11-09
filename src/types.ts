import z from "zod"
const userschema=z.object({username:z.string().min(1),password:z.string().min(1)})
type userg= typeof userschema

declare global{
    namespace Express{
        interface Request{
            userId:string
        }
    }
}