import UserProfile       from '../../shared/models/UserProfile.js';
import profileValidation from './profileValidation.js';

// GET /api/profile
async function getProfile(req, res, next) {
  try {
    const profile = await UserProfile.findOne({ user_id: req.userId }).lean();

    if (!profile) {
      return res.status(404).json({ error: 'No profile found for this account.' });
    }

    return res.status(200).json({
      income:        profile.net_income,
      equity:        profile.equity,
      savings:       profile.monthly_savings,
      householdSize: profile.household_size,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/profile  — create; enforces one profile per user
async function createProfile(req, res, next) {
  try {
    const existing = await UserProfile.findOne({ user_id: req.userId }).lean();
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
      user_id:         req.userId,
      net_income:      income,
      equity:          equity,
      monthly_savings: savings,
      household_size:  householdSize,
    });

    return res.status(201).json({ success: true });
  } catch (err) {
    next(err);
  }
}

// PUT /api/profile  — update existing profile
async function updateProfile(req, res, next) {
  try {
    const profile = await UserProfile.findOne({ user_id: req.userId });

    if (!profile) {
      return res.status(404).json({ error: 'No profile found to update.' });
    }

    const { income, equity, savings, householdSize } = req.body;

    const validation = profileValidation.validate({ income, equity, savings, householdSize });
    if (!validation.valid) {
      return res.status(400).json({ errors: validation.errors });
    }

    profile.net_income      = income;
    profile.equity          = equity;
    profile.monthly_savings = savings;
    profile.household_size  = householdSize;
    await profile.save();

    return res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}

export { getProfile, createProfile, updateProfile };
