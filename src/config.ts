const secret = process.env["JWT_SECRET"];
if (!secret) throw new Error("JWT_SECRET is not set. Add it to .env");

export const JWT_SECRET = secret;
export const TOKEN_EXPIRY = "7d";
