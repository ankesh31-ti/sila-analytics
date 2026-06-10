# SILA Healthcare Analytics — Full Stack
### Express Backend + Supabase + Vercel Deploy

---

## Project Structure

```
sila-backend/
├── server.js               ← Express app entry point (run this)
├── routes/
│   ├── auth.js             ← POST /api/auth/register, /login, GET /me
│   └── sessions.js         ← CRUD /api/sessions and /api/sessions/:id
├── lib/
│   ├── supabase.js         ← Supabase client
│   └── auth.js             ← JWT sign/verify/middleware
├── public/
│   └── index.html          ← Full SILA frontend (served by Express)
├── schema.sql              ← Run once in Supabase SQL Editor
├── .env.example            ← Copy to .env and fill in values
├── package.json
└── README.md
```

---

## API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | /api/auth/register | ❌ | Create account |
| POST | /api/auth/login | ❌ | Login, get JWT |
| GET | /api/auth/me | ✅ | Get current user |
| GET | /api/sessions | ✅ | List all sessions |
| POST | /api/sessions | ✅ | Create new session |
| GET | /api/sessions/:id | ✅ | Get session + messages |
| POST | /api/sessions/:id | ✅ | Save message to session |
| PATCH | /api/sessions/:id | ✅ | Rename session |
| DELETE | /api/sessions/:id | ✅ | Delete session |
| GET | /api/health | ❌ | Health check |

---

## Run Locally

### 1. Set up Supabase
1. Go to **supabase.com** → create free account → New project
2. SQL Editor → paste contents of `schema.sql` → Run
3. Settings → API → copy **Project URL** and **service_role** key

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env and fill in your SUPABASE_URL and SUPABASE_SERVICE_KEY
```

### 3. Install and run
```bash
npm install
npm start
# Server starts at http://localhost:4000
# Frontend at http://localhost:4000
# API at http://localhost:4000/api/health
```

---

## Deploy to Vercel

Vercel supports Express apps via `@vercel/node`.

### 1. Add vercel.json
Create this file in the project root:
```json
{
  "version": 2,
  "builds": [{ "src": "server.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "server.js" }]
}
```

### 2. Push to GitHub
```bash
git init
git add .
git commit -m "SILA full stack deploy"
git remote add origin https://github.com/YOUR_USERNAME/sila-analytics.git
git push -u origin main
```

### 3. Deploy on Vercel
1. vercel.com → Import GitHub repo
2. Settings → Environment Variables → add:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `JWT_SECRET` (any random string)
3. Deploy → your app is live!

---

## Test the API locally

```bash
# Health check
curl http://localhost:4000/api/health

# Register
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Dr. Ankesh","email":"ankesh@hospital.com","password":"test123","hospital":"NDIM Medical"}'

# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ankesh@hospital.com","password":"test123"}'

# Use the token from login response for authenticated routes:
curl http://localhost:4000/api/sessions \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```
