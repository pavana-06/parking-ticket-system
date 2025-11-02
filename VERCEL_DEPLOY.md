# Vercel Deployment Guide

## ⚠️ Important: Database Limitation

**SQLite on Vercel has limitations:**
- Vercel uses serverless functions with read-only file system
- The `/tmp` directory is available but **ephemeral** (data is lost when function restarts)
- **Data will NOT persist** between deployments or function cold starts

### Solutions:

1. **For Development/Testing:** Current setup works but data resets frequently
2. **For Production:** Use a cloud database service:
   - **PostgreSQL** (Vercel Postgres, Supabase, Railway, Neon)
   - **MongoDB** (MongoDB Atlas)
   - **SQLite in Cloud** (Turso, Cloudflare D1)

---

## Deployment Steps

### 1. Update Vercel Configuration

The `vercel.json` and `api/index.js` files have been created. 

### 2. Deploy to Vercel

**Option A: Via Vercel Dashboard**
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Vercel will auto-detect settings
4. Click "Deploy"

**Option B: Via CLI**
```bash
npm i -g vercel
vercel login
vercel
```

### 3. Update API Base URL in Frontend

After deployment, update `script.js`:

```javascript
// Change this line:
const API_BASE_URL = 'http://localhost:3000/api';

// To your Vercel URL:
const API_BASE_URL = 'https://your-app.vercel.app/api';
```

Or better, use environment detection:

```javascript
const API_BASE_URL = window.location.origin + '/api';
```

---

## Recommended: Switch to Cloud Database

### Option 1: Vercel Postgres (Recommended)

1. **Add Vercel Postgres to your project**
   - Vercel Dashboard → Storage → Create Database → Postgres

2. **Install PostgreSQL client:**
   ```bash
   npm install @vercel/postgres
   ```

3. **Update database.js** to use Postgres instead of SQLite

### Option 2: Supabase (Free Tier Available)

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Get connection string
4. Update database connection

---

## Current Setup (SQLite - Limited Persistence)

The current setup uses SQLite in `/tmp` directory:
- ✅ Works for testing
- ❌ Data resets on cold start
- ❌ Not suitable for production

---

## Fix Frontend API URL

Update `script.js` to automatically detect the environment:

```javascript
// Replace this line:
const API_BASE_URL = 'http://localhost:3000/api';

// With this:
const API_BASE_URL = window.location.origin + '/api';
```

This will automatically use the correct URL whether running locally or on Vercel.

---

## Troubleshooting

### Error: "FUNCTION_INVOCATION_FAILED"
- Check Vercel logs in dashboard
- Verify database initialization
- Check environment variables

### Error: "Database initialization failed"
- SQLite might not work in serverless environment
- Consider switching to cloud database

### Data Not Persisting
- This is expected with SQLite on Vercel
- Use a cloud database for persistence

---

## Next Steps

1. ✅ Deploy with current SQLite setup (for testing)
2. 📝 Switch to Vercel Postgres or Supabase for production
3. 🔄 Update frontend API URL
4. ✨ Test the deployed application
