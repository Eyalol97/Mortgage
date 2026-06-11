import 'dotenv/config';

const REQUIRED = [
  'MONGODB_URI',
  'AUTH_SECRET',
  'AUTH_EXPIRY',
  'MAIN_LLM_API_KEY',
  'MAIN_LLM_ENDPOINT',
  'CLASSIFIER_LLM_API_KEY',
  'CLASSIFIER_LLM_ENDPOINT',
  'BOI_API_KEY',
  'BOI_API_ENDPOINT',
  'PDF_SIZE_LIMIT',
];

for (const key of REQUIRED) {
  if (!process.env[key]) {
    console.error(`[env] Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

export const PORT                  = process.env.PORT || 3000;
export const MONGODB_URI           = process.env.MONGODB_URI;
export const AUTH_SECRET           = process.env.AUTH_SECRET;
export const AUTH_EXPIRY           = process.env.AUTH_EXPIRY;
export const MAIN_LLM_API_KEY      = process.env.MAIN_LLM_API_KEY;
export const MAIN_LLM_ENDPOINT     = process.env.MAIN_LLM_ENDPOINT;
export const CLASSIFIER_LLM_API_KEY  = process.env.CLASSIFIER_LLM_API_KEY;
export const CLASSIFIER_LLM_ENDPOINT = process.env.CLASSIFIER_LLM_ENDPOINT;
export const BOI_API_KEY           = process.env.BOI_API_KEY;
export const BOI_API_ENDPOINT      = process.env.BOI_API_ENDPOINT;
export const PDF_SIZE_LIMIT        = Number(process.env.PDF_SIZE_LIMIT);

export default {
  PORT,
  MONGODB_URI,
  AUTH_SECRET,
  AUTH_EXPIRY,
  MAIN_LLM_API_KEY,
  MAIN_LLM_ENDPOINT,
  CLASSIFIER_LLM_API_KEY,
  CLASSIFIER_LLM_ENDPOINT,
  BOI_API_KEY,
  BOI_API_ENDPOINT,
  PDF_SIZE_LIMIT,
};
