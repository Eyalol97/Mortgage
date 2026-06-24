'use strict';

import User          from '../../shared/models/User.js';
import UserProfile   from '../../shared/models/UserProfile.js';
import UsageCounter  from '../../shared/models/UsageCounter.js';
import GuardrailLog  from '../../shared/models/GuardrailLog.js';

// GET /api/admin/stats
export async function getStats(req, res, next) {
  try {
    const [users, profiles, logs] = await Promise.all([
      User.countDocuments(),
      UserProfile.countDocuments(),
      GuardrailLog.countDocuments(),
    ]);
    const usage = await UsageCounter.find().lean();
    res.json({ users, profiles, logs, usage });
  } catch (err) { next(err); }
}

// GET /api/admin/users?search=email
export async function getUsers(req, res, next) {
  try {
    const filter = req.query.search
      ? { email: { $regex: req.query.search, $options: 'i' } }
      : {};
    const users = await User.find(filter)
      .select('email googleId created_at')
      .sort({ created_at: -1 })
      .limit(200)
      .lean();
    res.json(users);
  } catch (err) { next(err); }
}

// DELETE /api/admin/users/:id
export async function deleteUser(req, res, next) {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    // Also remove their profile
    await UserProfile.deleteOne({ user_id: req.params.id });
    res.json({ message: 'User and their profile deleted.' });
  } catch (err) { next(err); }
}

// GET /api/admin/profiles
export async function getProfiles(req, res, next) {
  try {
    const profiles = await UserProfile.find()
      .sort({ created_at: -1 })
      .limit(200)
      .lean();

    // Attach email to each profile
    const userIds = profiles.map(p => p.user_id);
    const users   = await User.find({ _id: { $in: userIds } }).select('email').lean();
    const emailMap = Object.fromEntries(users.map(u => [u._id.toString(), u.email]));

    const result = profiles.map(p => ({
      ...p,
      email: emailMap[p.user_id?.toString()] || '—',
    }));
    res.json(result);
  } catch (err) { next(err); }
}

// DELETE /api/admin/profiles/:id
export async function deleteProfile(req, res, next) {
  try {
    const profile = await UserProfile.findByIdAndDelete(req.params.id);
    if (!profile) return res.status(404).json({ message: 'Profile not found.' });
    res.json({ message: 'Profile deleted.' });
  } catch (err) { next(err); }
}

// GET /api/admin/logs?limit=100
export async function getLogs(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    const logs  = await GuardrailLog.find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
    res.json(logs);
  } catch (err) { next(err); }
}
