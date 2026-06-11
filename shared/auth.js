import crypto from 'crypto';
import env    from './env.js';
import User   from './models/User.js';

// ── Token helpers (HMAC-SHA256 JWT, no external dependency) ──────────────────

function _b64url(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

const _HEADER = _b64url(Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));

function _sign(payload) {
  const body = _b64url(Buffer.from(JSON.stringify(payload)));
  const sig  = _b64url(
    crypto.createHmac('sha256', env.AUTH_SECRET).update(`${_HEADER}.${body}`).digest()
  );
  return `${_HEADER}.${body}.${sig}`;
}

function _verify(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;
  const expected = _b64url(
    crypto.createHmac('sha256', env.AUTH_SECRET).update(`${header}.${body}`).digest()
  );
  if (sig !== expected) return null;
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
  if (payload.exp && Date.now() > payload.exp) return null;
  return payload;
}

function _issueToken(userId) {
  const expiryMs = _parseExpiry(env.AUTH_EXPIRY);
  return _sign({ sub: userId.toString(), exp: Date.now() + expiryMs });
}

function _parseExpiry(str) {
  const units = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  const match = /^(\d+)([smhd])$/.exec(str);
  return match ? parseInt(match[1], 10) * units[match[2]] : 86_400_000;
}

// ── Password helpers (Node built-in scrypt) ───────────────────────────────────

async function _hashPassword(plain) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await new Promise((res, rej) =>
    crypto.scrypt(plain, salt, 64, (err, key) => (err ? rej(err) : res(key)))
  );
  return `${salt}:${hash.toString('hex')}`;
}

async function _checkPassword(plain, stored) {
  const [salt, hash] = stored.split(':');
  const derived = await new Promise((res, rej) =>
    crypto.scrypt(plain, salt, 64, (err, key) => (err ? rej(err) : res(key)))
  );
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), derived);
}

// ── Route handlers ────────────────────────────────────────────────────────────

async function signup(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) {
      return res.status(409).json({ message: 'An account with that email already exists.' });
    }

    const user = await User.create({
      email:        email.toLowerCase().trim(),
      passwordHash: await _hashPassword(password),
    });

    return res.status(201).json({ token: _issueToken(user._id) });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const match = await _checkPassword(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    return res.json({ token: _issueToken(user._id) });
  } catch (err) {
    next(err);
  }
}

// ── Middleware ────────────────────────────────────────────────────────────────

function authMiddleware(req, res, next) {
  const header = req.headers['authorization'] ?? '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  const payload = _verify(token);

  if (!payload) {
    return res.status(401).json({ message: 'Unauthorised — valid token required.' });
  }

  req.userId = payload.sub;
  next();
}

export { signup, login, authMiddleware };
