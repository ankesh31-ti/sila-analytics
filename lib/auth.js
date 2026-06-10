const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'sila-fallback-secret';

function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

// Express middleware — attaches decoded payload to req.user
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized — no token provided' });
  }
  const payload = verifyToken(auth.slice(7));
  if (!payload) {
    return res.status(401).json({ error: 'Unauthorized — invalid or expired token' });
  }
  req.user = payload;
  next();
}

module.exports = { signToken, verifyToken, requireAuth };
