import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
  isVercel: Boolean(process.env.VERCEL),
  appUrl: process.env.APP_URL || "http://localhost:3000",

  // SuperAdmin Seed Configuration
  superAdminEmail: (process.env.SUPERADMIN_EMAIL || "abdullah106556661@gmail.com").toLowerCase().trim(),
  superAdminInitialPassword: process.env.SUPERADMIN_INITIAL_PASSWORD || "NovaCutSuperAdmin2026!",

  // Database Connection
  databaseUrl:
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.SUPABASE_DB_URL ||
    "",

  // Gemini & AI Models
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  models: {
    text: process.env.AI_TEXT_MODEL || "gemini-3.6-flash",
    textFast: "gemini-3.1-flash-lite",
    vision: process.env.AI_VISION_MODEL || "gemini-3.6-flash",
    image: process.env.AI_IMAGE_MODEL || "gemini-3.1-flash-lite-image",
    imageHighQuality: "gemini-3.1-flash-image",
    video: process.env.AI_VIDEO_MODEL || "veo-3.1-generate-preview",
    videoLite: "veo-3.1-lite-generate-preview",
    tts: process.env.AI_TTS_MODEL || "gemini-3.1-flash-tts-preview",
    transcribe: process.env.AI_AUDIO_MODEL || "gemini-3.5-transcribe",
  },

  // Credit Consumption Costs
  credits: {
    photo: 25,
    video: 100,
    prompt: 5,
    dailyFreeAllowance: 500,
  },

  // Security & Sessions
  sessionCookieName: "novacut_session",
  sessionExpiryDays: 30,
  passwordResetExpiryMinutes: 15,
  saltRounds: 12,

  // Allowed CORS Origins
  corsOrigins: [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    process.env.APP_URL || "",
  ].filter(Boolean),
};
