# Deployment Guide for Vercel

## Quick Deploy

1. **Connect to Vercel:**
   ```bash
   npx vercel --prod
   ```

2. **Or via Vercel Dashboard:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect the project

## Environment Variables Required

Set these in Vercel dashboard under **Settings → Environment Variables**:

### Frontend Variables
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon public key  
- `VITE_API_URL` - Will be auto-set to your Vercel domain + /api

### Backend Variables  
- `SUPABASE_URL` - Same as frontend
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `JWT_SECRET` - Random secret for JWT tokens
- `NODE_ENV=production`

## Project Structure

This is a **monorepo** with:
- **Frontend**: React + Vite in `/frontend`
- **Backend**: Node.js + Express in `/backend`

The `vercel.json` config handles:
- Building frontend from `/frontend` folder
- Routing API calls to serverless functions
- CORS headers for API

## Build Configuration

The build process:
1. Installs dependencies in `/frontend`
2. Runs `npm run build` in frontend
3. Deploys backend as serverless functions
4. Routes `/api/*` to backend, everything else to frontend

## Domain Setup

Once deployed:
- Your app will be at `https://your-project.vercel.app`
- API endpoints at `https://your-project.vercel.app/api/*`
- You can add custom domains in Vercel dashboard

## Troubleshooting

If build fails:
1. Check environment variables are set
2. Ensure `package.json` build script works locally
3. Check Vercel build logs for specific errors
4. Verify Supabase credentials are correct
