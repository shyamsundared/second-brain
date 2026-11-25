// Fail at startup with one clear message, instead of a confusing error on the first request
const missing = ["DATABASE_URL", "JWT_SECRET"].filter((name) => !process.env[name]);
if (missing.length) throw new Error(`Missing environment variables: ${missing.join(", ")}. See .env.example`);

// Optional: the app works without these, with less
if (!process.env["YOUTUBE_API_KEY"]) console.warn("YOUTUBE_API_KEY is not set: YouTube videos will only be searchable by title");
if (!process.env["ANTHROPIC_API_KEY"]) console.warn("ANTHROPIC_API_KEY is not set: Ask is disabled");

export const JWT_SECRET = process.env["JWT_SECRET"]!;
export const TOKEN_EXPIRY = "7d";
