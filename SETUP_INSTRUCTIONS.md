# Jenny's Pudding - Supabase Setup Instructions

## 🚨 IMPORTANT: You need to complete these steps before the order submission will work!

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login to your account
3. Click "New Project"
4. Choose your organization
5. Fill in project details:
   - **Name**: `jennys-pudding` (or any name you prefer)
   - **Database Password**: Create a strong password
   - **Region**: Choose closest to your location
6. Click "Create new project"
7. Wait for the project to be created (takes 1-2 minutes)

### Step 2: Get Your Supabase Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **Anon public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### Step 3: Configure Environment Variables

1. In your `jennys-pudding` folder, create a file called `.env.local`
2. Add your Supabase credentials:

```bash
# Replace with your actual Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Example:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://lbinjgbiugpvukqjclwd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxiaW5qZ2JpdWdwdnVrcWpjbHdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI2MTI4MDAsImV4cCI6MjA0ODE4ODgwMH0.example-key
```

### Step 4: Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy the entire contents of `supabase-schema.sql` file
4. Paste it into the SQL editor
5. Click **Run** to execute the schema
6. You should see "Success. No rows returned" message

**IMPORTANT: Apply the Schema Fix**
7. Click "New query" again
8. Copy the entire contents of `supabase-schema-fix.sql` file
9. Paste it into the SQL editor
10. Click **Run** to execute the schema fixes
11. This fixes field length issues that could cause "value too long" errors

### Step 5: Configure Storage for Payment Proofs

1. In your Supabase dashboard, go to **Storage**
2. Click "Create a new bucket"
3. Set bucket name: `payment-proofs`
4. Make it **Public bucket**: ✅ (checked)
5. Click "Create bucket"

### Step 6: Set Up Storage Policies

1. In the Storage section, click on the `payment-proofs` bucket
2. Go to **Policies** tab
3. Click "New policy"
4. Choose "For full customization"
5. Add this policy for uploads:

```sql
-- Allow public uploads
CREATE POLICY "Allow public uploads" ON storage.objects
FOR INSERT TO public
WITH CHECK (bucket_id = 'payment-proofs');
```

6. Add another policy for downloads:

```sql
-- Allow public downloads
CREATE POLICY "Allow public downloads" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'payment-proofs');
```

### Step 7: Test the Setup

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Go to the payment page in your app
3. Check the browser console for these messages:
   ```
   === TESTING SUPABASE CONNECTION ===
   Connection test: { connectionTest: [...], connectionError: null }
   Function test: { functionTest: ..., functionError: null }
   Supabase URL configured: true
   Supabase Key configured: true
   ```

4. If you see any errors, check:
   - Your `.env.local` file has the correct credentials
   - The database schema was executed successfully
   - The storage bucket was created

### Step 8: Admin App Configuration

1. Copy the same `.env.local` file to your `admin-app` folder:
   ```bash
   cp jennys-pudding/.env.local admin-app/.env.local
   ```

2. Or create a new `.env.local` in the `admin-app` folder with the same content

### Troubleshooting

#### Error: "Failed to load resource: the server responded with a status of 400"

This usually means:
1. **Environment variables not set**: Check your `.env.local` file
2. **Database schema not created**: Run the SQL schema in Supabase
3. **Function doesn't exist**: The `insert_complete_order` function wasn't created

#### Error: "Connection failed"

This means:
1. **Wrong Supabase URL**: Check your project URL
2. **Wrong API key**: Check your anon key
3. **Project not ready**: Wait a few minutes after creating the project

#### Error: "Missing required fields"

This means the order data is incomplete. Check the console for which fields are missing.

### Verification Checklist

- [ ] Supabase project created
- [ ] `.env.local` file created with correct credentials
- [ ] Database schema executed successfully
- [ ] `payment-proofs` storage bucket created
- [ ] Storage policies configured
- [ ] Development server restarted
- [ ] Console shows successful connection test
- [ ] No errors in browser console

Once all steps are completed, you should be able to submit orders successfully! 