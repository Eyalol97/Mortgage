import crypto            from 'crypto';
import UserProfile       from '../../shared/models/UserProfile.js';
import profileValidation from './profileValidation.js';
import env               from '../../shared/env.js';

// ── Encryption setup ──────────────────────────────────────────────────────────
// Requires PROFILE_ENCRYPTION_KEY in env — a 64-char hex string (32 bytes).
// Validated eagerly so misconfiguration fails at startup, not at request time.

const ALGORITHM = 'aes-256-gcm';

const _encKey = (function () {
  const raw = env.PROFILE_ENCRYPTION_KEY;
  if (!raw || raw.length !== 64) {
    throw new Error('PROFILE_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
  }
  return Buffer.from(raw, 'hex');
})();

// Encrypted format: <iv_hex>:<authTag_hex>:<ciphertext_hex>
function _encrypt(value) {
  const iv     = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, _encKey, iv);
  const enc    = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${cipher.getAuthTag().toString('hex')}:${enc.toString('hex')}`;
}

function _decrypt(stored) {
  const [ivHex, tagHex, encHex] = stored.split(':');
  const decipher = crypto.createDecipheriv(ALGORITHM, _encKey, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return Buffer.concat([
    decipher.update(Buffer.from(encHex, 'hex')),
    decipher.final(),
  ]).toString('utf8');
}

// ── Response shape helpers ────────────────────────────────────────────────────

function _decryptProfile(doc) {
  return {
    income:        parseFloat(_decrypt(doc.income)),
    equity:        parseFloat(_decrypt(doc.equity)),
    savings:       parseFloat(_decrypt(doc.savings)),
    householdSize: parseInt(_decrypt(doc.householdSize), 10),
  };
}

function _encryptFields({ income, equity, savings, householdSize }) {
  return {
    income:        _encrypt(income),
    equity:        _encrypt(equity),
    savings:       _encrypt(savings),
    householdSize: _encrypt(householdSize),
  };
}

// ── Route handlers ────────────────────────────────────────────────────────────

// GET /api/profile
async function getProfile(req, res, next) {
  try {
    const userId  = req.user.id;
    const profile = await UserProfile.findOne({ userId }).lean();

    if (!profile) {
      return res.status(404).json({ error: 'No profile found for this account.' });
    }

    return res.status(200).json(_decryptProfile(profile));
  } catch (err) {
    next(err);
  }
}

// POST /api/profile  — create; enforces one profile per user
async function createProfile(req, res, next) {
  try {
    const userId = req.user.id;

    // One-profile-per-user enforcement
    const existing = await UserProfile.findOne({ userId }).lean();
    if (existing) {
      return res.status(409).json({
        error: 'A profile already exists for this account. Use PUT /api/profile to update it.',
      });
    }

    const { income, equity, savings, householdSize } = req.body;

    const validation = profileValidation.validate({ income, equity, savings, householdSize });
    if (!validation.valid) {
      return res.status(400).json({ errors: validation.errors });
    }

    await UserProfile.create({
      userId,
      ..._encryptFields({ income, equity, savings, householdSize }),
    });

    return res.status(201).json({ success: true });
  } catch (err) {
    next(err);
  }
}

// PUT /api/profile  — update; verifies the record belongs to the requesting user
async function updateProfile(req, res, next) {
  try {
    const userId  = req.user.id;
    const profile = await UserProfile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({ error: 'No profile found to update.' });
    }

    const { income, equity, savings, householdSize } = req.body;

    const validation = profileValidation.validate({ income, equity, savings, householdSize });
    if (!validation.valid) {
      return res.status(400).json({ errors: validation.errors });
    }

    Object.assign(profile, _encryptFields({ income, equity, savings, householdSize }));
    await profile.save();

    return res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}

export { getProfile, createProfile, updateProfile };
