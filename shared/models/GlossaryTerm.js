import mongoose from '../db.js';

const glossaryTermSchema = new mongoose.Schema(
  {
    term: {
      type:     String,
      required: true,
      unique:   true,
      trim:     true,
      index:    true,
    },
    definition: {
      type:     String,
      required: true,
    },
    related_terms: {
      type:    [String],
      default: [],
    },
  },
  {
    // auto-generates created_at; no updatedAt — terms are seeded, not updated
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

export default mongoose.model('GlossaryTerm', glossaryTermSchema);
