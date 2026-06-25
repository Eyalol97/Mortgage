import 'dotenv/config';

const REQUIRED = [
  'MONGODB_URI',
  'AUTH_SECRET',
  'AUTH_EXPIRY',
  'GEMINI_API_KEY',
  'PDF_SIZE_LIMIT',
];

for (const key of REQUIRED) {
  if (!process.env[key]) {
    console.error(`[env] Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

export const PORT            = process.env.PORT || 3000;
export const MONGODB_URI     = process.env.MONGODB_URI;
export const AUTH_SECRET     = process.env.AUTH_SECRET;
export const AUTH_EXPIRY     = process.env.AUTH_EXPIRY;
export const GEMINI_API_KEY  = (process.env.GEMINI_API_KEY || '').trim();
export const BOI_API_KEY     = process.env.BOI_API_KEY;
export const BOI_API_ENDPOINT = process.env.BOI_API_ENDPOINT;
export const PDF_SIZE_LIMIT  = Number(process.env.PDF_SIZE_LIMIT);
export const LLM_MODEL        = (process.env.LLM_MODEL || 'gemini-2.0-flash-lite').trim();
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
export const ADMIN_EMAIL      = process.env.ADMIN_EMAIL;

export default {
  PORT,
  MONGODB_URI,
  AUTH_SECRET,
  AUTH_EXPIRY,
  GEMINI_API_KEY,
  BOI_API_KEY,
  BOI_API_ENDPOINT,
  PDF_SIZE_LIMIT,
  LLM_MODEL,
  GOOGLE_CLIENT_ID,
  ADMIN_EMAIL,
};
