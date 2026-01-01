# Vercel Environment Variables Setup

## ✅ Migrations Completed Successfully

All database tables and storage buckets have been created in your Supabase project!

### Tables Created:
- ✅ collections
- ✅ products (with sizes column)
- ✅ orders
- ✅ discount_codes
- ✅ cart_reservations
- ✅ newsletter_subscribers

### Storage:
- ✅ artwork bucket (public, 10MB limit)

## Configure Vercel Environment Variables

Go to your Vercel project settings → Environment Variables and add:

### Supabase Configuration

```env
NEXT_PUBLIC_SUPABASE_URL=https://xcrzjtplxkxnaddfdwgh.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjcnpqdHBseGt4bmFkZGZkd2doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyNTg4NTMsImV4cCI6MjA4MjgzNDg1M30.9jNLViyS0ydtygAxNyUQ3jgIq1ymI0JobE5pwAQNl3o

# Service Role Key (⚠️ KEEP SECRET - Server-side only)
# Get this from: https://supabase.com/dashboard/project/xcrzjtplxkxnaddfdwgh/settings/api
# Look for "service_role" key (NOT the anon key above)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-from-dashboard
```

### App Configuration

```env
NEXT_PUBLIC_SITE_URL=https://your-vercel-app.vercel.app
```

### Optional (for later)

```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Important Notes:

1. **Get Service Role Key**: 
   - Go to [Supabase Dashboard → Project Settings → API](https://supabase.com/dashboard/project/xcrzjtplxkxnaddfdwgh/settings/api)
   - Copy the **service_role** key (NOT the anon key)
   - Add it to `SUPABASE_SERVICE_ROLE_KEY` in Vercel

2. **Security**:
   - ⚠️ Never commit the service role key to git
   - ⚠️ Only use it in server-side code (API routes)
   - ✅ The anon key is safe for client-side use

3. **After Setting Variables**:
   - Redeploy your Vercel app
   - Test the admin panel at `/admin/login`
   - Try uploading an image

## Testing

Once configured, you should be able to:
- ✅ Access `/admin/products` without "failed to fetch" error
- ✅ Upload images successfully
- ✅ Create and manage products

## Project Information

- **Project Name**: dotty-webshop
- **Region**: eu-north-1 (Stockholm)
- **Database Version**: PostgreSQL 17
- **Status**: Active & Healthy ✅
