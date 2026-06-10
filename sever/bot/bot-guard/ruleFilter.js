import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rulesPath = join(__dirname, '../../../shared/models/seed/guardrailRules.json');
const rules = JSON.parse(readFileSync(rulesPath, 'utf-8'));

// Normalise once at startup — filter() is called on every request
const advisoryKeywords = (rules.advisoryKeywords ?? []).map((k) => k.toLowerCase());
const domainBlocklist  = (rules.domainBlocklist  ?? []).map((k) => k.toLowerCase());

function _matches(text, keywords) {
  return keywords.some((k) => text.includes(k));
}

// filter(classifierResult, query) → { decision: "ALLOW" | "ADVISORY_BLOCK" | "DOMAIN_BLOCK" }
//
// Keyword checks take priority over the LLM classifier so that explicit rule
// violations are caught even when the classifier is uncertain or wrong.
async function filter({ category }, query) {
  const text = query.toLowerCase();

  if (_matches(text, domainBlocklist))  return { decision: 'DOMAIN_BLOCK'    };
  if (_matches(text, advisoryKeywords)) return { decision: 'ADVISORY_BLOCK'  };

  if (category === 'OUT_OF_DOMAIN') return { decision: 'DOMAIN_BLOCK'   };
  if (category === 'ADVISORY')      return { decision: 'ADVISORY_BLOCK' };

  return { decision: 'ALLOW' };
}

export default { filter };
