import { createRequire } from 'module';
import GlossaryTerm      from '../GlossaryTerm.js';

const require = createRequire(import.meta.url);

export async function seedGlossary() {
  try {
    const terms = require('./glossary.json');

    await GlossaryTerm.deleteMany({});
    await GlossaryTerm.insertMany(terms, { ordered: false });

    console.log(`[seed] Glossary seeded — ${terms.length} terms loaded.`);
  } catch (err) {
    console.error('[seed] Glossary seeding failed:', err.message);
  }
}
