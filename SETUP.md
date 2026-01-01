# Dotty Webshop Setup Guide

## Environment Variables Setup

You need to create a `.env.local` file in the root directory with your Supabase credentials.

### Step 1: Copy the example file

```bash
cp .env.example .env.local
```

### Step 2: Get your Supabase credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (or create a new one)
3. Go to **Settings** → **API**
4. Copy the following values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep this secret!)

### Step 3: Update .env.local

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe (optional for now)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# App
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Step 4: Run database migrations

Make sure you've run the migrations in your Supabase project:

1. Go to **SQL Editor** in Supabase Dashboard
2. Run `supabase/migrations/001_initial_schema.sql`
3. Run `supabase/migrations/002_add_sizes_and_storage.sql`

Or use the Supabase CLI:

```bash
supabase db push
```

### Step 5: Verify setup

Restart your dev server:

```bash
npm run dev
```

Visit http://localhost:3000/admin/login to test the admin panel.

## Troubleshooting

### "Failed to fetch products"
- Check that your `.env.local` file exists and has valid Supabase credentials
- Verify that you've run the database migrations
- Check the browser console and terminal for detailed error messages

### "Upload failed"
- Ensure the `artwork` storage bucket exists in Supabase (created by migration 002)
- Check that RLS policies are set correctly on the storage bucket
- Verify that your service role key is correct

### "Missing Supabase environment variables"
- Make sure `.env.local` exists in the root directory
- Restart your Next.js dev server after creating/updating `.env.local`
- Check that variable names match exactly (case-sensitive)
