const router = require('express').Router();
const { supabase } = require('../lib/supabase');
const { requireAuth } = require('../lib/auth');

// All routes require auth
router.use(requireAuth);

// ── GET /api/sessions ────────────────────────────────────────────────────────
// Returns all sessions for the logged-in user, newest first
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('sessions')
    .select('id, title, created_at, updated_at')
    .eq('user_id', req.user.id)
    .order('updated_at', { ascending: false })
    .limit(50);

  if (error) return res.status(500).json({ error: 'Failed to fetch sessions' });
  return res.json({ sessions: data });
});

// ── POST /api/sessions ───────────────────────────────────────────────────────
// Creates a new session
router.post('/', async (req, res) => {
  const { title } = req.body;

  const { data, error } = await supabase
    .from('sessions')
    .insert({ user_id: req.user.id, title: title || 'New Session' })
    .select('id, title, created_at, updated_at')
    .single();

  if (error) return res.status(500).json({ error: 'Failed to create session' });
  console.log(`📝 New session: "${data.title}" for user ${req.user.id}`);
  return res.status(201).json({ session: data });
});

// ── GET /api/sessions/:id ────────────────────────────────────────────────────
// Returns a session + all its messages
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  const { data: session } = await supabase
    .from('sessions')
    .select('id, title, created_at, updated_at')
    .eq('id', id)
    .eq('user_id', req.user.id)
    .maybeSingle();

  if (!session) return res.status(404).json({ error: 'Session not found' });

  const { data: messages, error } = await supabase
    .from('messages')
    .select('id, role, content, kpi_data, created_at')
    .eq('session_id', id)
    .order('created_at', { ascending: true });

  if (error) return res.status(500).json({ error: 'Failed to fetch messages' });
  return res.json({ session, messages });
});

// ── POST /api/sessions/:id ───────────────────────────────────────────────────
// Saves a new message to a session
router.post('/:id', async (req, res) => {
  const { id } = req.params;
  const { role, content, kpi_data } = req.body;

  if (!role || !content) {
    return res.status(400).json({ error: 'role and content are required' });
  }

  // Verify ownership
  const { data: session } = await supabase
    .from('sessions')
    .select('id')
    .eq('id', id)
    .eq('user_id', req.user.id)
    .maybeSingle();

  if (!session) return res.status(404).json({ error: 'Session not found' });

  const { data: msg, error } = await supabase
    .from('messages')
    .insert({ session_id: id, user_id: req.user.id, role, content, kpi_data: kpi_data || null })
    .select('id, role, content, kpi_data, created_at')
    .single();

  if (error) return res.status(500).json({ error: 'Failed to save message' });

  // Bump session updated_at
  await supabase
    .from('sessions')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', id);

  return res.status(201).json({ message: msg });
});

// ── PATCH /api/sessions/:id ──────────────────────────────────────────────────
// Updates session title
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;

  const { error } = await supabase
    .from('sessions')
    .update({ title })
    .eq('id', id)
    .eq('user_id', req.user.id);

  if (error) return res.status(500).json({ error: 'Failed to update session' });
  return res.json({ success: true });
});

// ── DELETE /api/sessions/:id ─────────────────────────────────────────────────
// Deletes a session and all its messages
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  // Verify ownership first
  const { data: session } = await supabase
    .from('sessions')
    .select('id')
    .eq('id', id)
    .eq('user_id', req.user.id)
    .maybeSingle();

  if (!session) return res.status(404).json({ error: 'Session not found' });

  await supabase.from('messages').delete().eq('session_id', id);
  await supabase.from('sessions').delete().eq('id', id);

  console.log(`🗑️  Deleted session ${id}`);
  return res.json({ success: true });
});

module.exports = router;
