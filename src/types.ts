import { z } from "zod"

// Request body schemas. Routes reject anything that doesn't match with a 400.
export const signupSchema = z.object({
    username: z.string().trim().min(3, "must be at least 3 characters").max(30, "must be at most 30 characters"),
    password: z.string().min(6, "must be at least 6 characters").max(100, "must be at most 100 characters"),
})

// No length rules here, so users created before the rules existed can still sign in
export const signinSchema = z.object({
    username: z.string().trim().min(1, "is required"),
    password: z.string().min(1, "is required"),
})

export const contentSchema = z.object({
    link: z.url("must be a valid URL"),
    title: z.string().trim().max(200, "must be at most 200 characters").default(""),
    type: z.enum(["image", "video", "article", "audio"]),
    tags: z.array(z.string().max(30, "must be at most 30 characters")).max(10, "at most 10 tags").default([]),
})

export const shareSchema = z.object({
    share: z.boolean(),
})

export const askSchema = z.object({
    question: z.string().trim().min(3, "must be at least 3 characters").max(500, "must be at most 500 characters"),
})

declare global{
    namespace Express{
        interface Request{
            userId:number
        }
    }
}
