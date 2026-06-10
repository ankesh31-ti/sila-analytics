const router   = require('express').Router();
const bcrypt   = require('bcryptjs');
const { supabase }   = require('../lib/supabase');
const { signToken, requireAuth } = require('../lib/auth');

// ── POST /api/auth/register ──────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { email, password, name, hospital } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password and name are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  // Check duplicate
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase())
    .maybeSingle();

  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const password_hash = await bcrypt.hash(password, 10);

  const { data: user, error } = await supabase
    .from('users')
    .insert({ email: email.toLowerCase(), password_hash, name, hospital: hospital || null })
    .select('id, email, name, hospital, role, created_at')
    .single();

  if (error) {
    console.error('Register error:', error.message);
    return res.status(500).json({ error: 'Failed to create account' });
  }

  const token = signToken({ id: user.id, email: user.email });
  console.log(`✅ New user registered: ${user.email}`);
  return res.status(201).json({ token, user });
});

// ── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, name, hospital, role, password_hash, created_at')
    .eq('email', email.toLowerCase())
    .maybeSingle();

  if (error || !user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const { password_hash, ...safeUser } = user;
  const token = signToken({ id: user.id, email: user.email });
  console.log(`✅ Login: ${user.email}`);
  return res.status(200).json({ token, user: safeUser });
});

// ── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, name, hospital, role, created_at')
    .eq('id', req.user.id)
    .maybeSingle();

  if (error || !user) {
    return res.status(404).json({ error: 'User not found' });
  }
  return res.status(200).json({ user });
});

module.exports = router;
