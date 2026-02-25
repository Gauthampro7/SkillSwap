# Supabase Setup Guide for SkillSwap

This guide will walk you through setting up Supabase for SkillSwap with Google OAuth authentication.

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in:
   - **Name**: SkillSwap (or any name)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to you
4. Wait for project to be created (~2 minutes)

## Step 2: Set Up Google OAuth

1. In your Supabase project, go to **Authentication** → **Providers**
2. Find **Google** and click **Enable**
3. You'll need Google OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable **Google+ API**
   - Go to **Credentials** → **Create Credentials** → **OAuth client ID**
   - Choose **Web application**
   - Add authorized redirect URIs:
     - `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
     - You can find your project ref in Supabase project settings
   - Copy **Client ID** and **Client Secret**
4. Back in Supabase, paste:
   - **Client ID (for OAuth)**
   - **Client Secret (for OAuth)**
5. Click **Save**

## Step 3: Set Up Database Schema

1. In Supabase, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste the entire contents of `supabase-schema.sql`
4. Click **Run** (or press Ctrl+Enter)
5. Verify tables were created:
   - Go to **Table Editor**
   - You should see `users`, `skills`, `trade_requests`, and `saved_skills` tables

## Step 4: Configure Environment Variables

1. In Supabase, go to **Settings** → **API**
2. Copy:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (long string)
3. In your project root, create a `.env` file:
   ```env
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```
4. **Important**: Add `.env` to `.gitignore` if not already there!

## Step 5: Install and Run

```bash
npm install
npm run dev
```

Open `http://localhost:5173` and sign in with Google to verify.

## Database Structure

### Users Table
- `id` (UUID, references auth.users)
- `name` (TEXT)
- `email` (TEXT)
- `picture` (TEXT)
- `university` (TEXT)
- `location` (TEXT)
- `created_at`, `updated_at`

### Skills Table
- `id` (UUID)
- `title` (TEXT)
- `description` (TEXT)
- `category` (TEXT: Tech, Arts, Academic, Life Skills)
- `type` (TEXT: Offering, Seeking)
- `location` (TEXT)
- `status` (TEXT: active, completed, cancelled)
- `user_id` (UUID, references users)
- `created_at`, `updated_at`

## Security Features

- **Row Level Security (RLS)** enabled on all tables
- Users can only modify their own data
- Public read access for active skills only
- Automatic user profile creation on signup

## Troubleshooting

### "Missing Supabase environment variables"
- Make sure `.env` file exists in project root
- Check that variable names start with `VITE_`
- Restart dev server after creating `.env`

### Google OAuth not working
- Verify redirect URI matches exactly in Google Console
- Check that Google OAuth is enabled in Supabase
- Make sure Client ID and Secret are correct

### Database errors
- Run the SQL schema again
- Check that RLS policies are created
- Verify tables exist in Table Editor

### Can't create skills
- Make sure you're logged in
- Check browser console for errors
- Verify RLS policies allow INSERT for authenticated users

## Production Deployment

When deploying:

1. Update Supabase redirect URLs:
   - Add your production URL to Google OAuth redirect URIs (e.g. `https://skillswap.gautham.pw/`)
   - Add production URL to Supabase Authentication → URL Configuration → Redirect URLs

2. Set environment variables in your hosting platform:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

3. Update CORS settings in Supabase if needed
