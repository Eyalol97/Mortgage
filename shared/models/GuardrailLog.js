import mongoose from '../db.js';

const CLASSIFIER_CATEGORIES   = ['EDUCATION', 'ADVISORY', 'OUT_OF_DOMAIN', 'AMBIGUOUS'];
const RULE_FILTER_DECISIONS    = ['ALLOW', 'ADVISORY_BLOCK', 'DOMAIN_BLOCK'];

const guardrailLogSchema = new mongoose.Schema(
  {
    classifier_category: {
      type:     String,
      required: true,
      enum:     CLASSIFIER_CATEGORIES,
    },
    rule_filter_decision: {
      type:     String,
      required: true,
      enum:     RULE_FILTER_DECISIONS,
    },
    // No user ID, no query text, no session data — anonymous by design
  },
  {
    timestamps: { createdAt: 'timestamp', updatedAt: false },
  }
);

export default mongoose.model('GuardrailLog', guardrailLogSchema);
