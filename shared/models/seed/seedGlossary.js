import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path              from 'path';
import GlossaryTerm      from '../GlossaryTerm.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(__dirname, 'glossary.json');

export async function seedGlossary() {
  try {
    const terms = JSON.parse(readFileSync(DATA_PATH, 'utf8'));

    // Drop all existing terms so renamed or removed entries don't linger
    await GlossaryTerm.deleteMany({});

    await GlossaryTerm.insertMany(terms, { ordered: false });

    console.log(`[seed] Glossary seeded — ${terms.length} terms loaded.`);
  } catch (err) {
    // Non-fatal: log and continue — the server still starts
    console.error('[seed] Glossary seeding failed:', err.message);
  }
}
