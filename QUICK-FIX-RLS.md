# Quick Fix: Apply SILPANA RLS Policy

## ⚡ Fast Solution

Your form submission is blocked by Supabase Row-Level Security. Here's the fastest way to fix it:

### 1. Open Supabase SQL Editor

Go to: https://app.supabase.com/project/YOUR_PROJECT/sql

### 2. Copy & Run This SQL

```sql
-- Enable RLS if not already enabled
ALTER TABLE public.silpana ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Allow public complaint submission" ON public.silpana;
DROP POLICY IF EXISTS "Allow authenticated users to view complaints" ON public.silpana;
DROP POLICY IF EXISTS "Allow authenticated users to update complaints" ON public.silpana;

-- Allow public complaint submission
CREATE POLICY "Allow public complaint submission"
ON public.silpana
FOR INSERT
TO anon, authenticated
WITH CHECK (
  LENGTH(TRIM(nama_pengaduan)) >= 3 AND
  LENGTH(TRIM(kategori_pengaduan)) >= 2 AND
  LENGTH(TRIM(deskripsi_pengaduan)) >= 10 AND
  tanggal_pengaduan IS NOT NULL AND
  ticket_status = 'submitted'
);

-- Allow authenticated users to view all complaints
CREATE POLICY "Allow authenticated users to view complaints"
ON public.silpana
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to update complaints
CREATE POLICY "Allow authenticated users to update complaints"
ON public.silpana
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Grant permissions
GRANT INSERT ON public.silpana TO anon;
GRANT INSERT ON public.silpana TO authenticated;
GRANT SELECT, UPDATE ON public.silpana TO authenticated;

-- Grant permission to use the sequence and functions (CRITICAL for anonymous users!)
GRANT USAGE, SELECT ON SEQUENCE ticket_code_sequence TO anon;
GRANT USAGE, SELECT ON SEQUENCE ticket_code_sequence TO authenticated;
GRANT EXECUTE ON FUNCTION generate_ticket_code() TO anon;
GRANT EXECUTE ON FUNCTION generate_ticket_code() TO authenticated;
GRANT EXECUTE ON FUNCTION set_ticket_code() TO anon;
GRANT EXECUTE ON FUNCTION set_ticket_code() TO authenticated;
```

### 3. Test Your Form

Refresh your browser and try submitting the form again. It should work! ✅

---

## 🔍 What This Does

- **Allows anonymous users** to submit complaints via your public form
- **Validates data** at the database level (minimum requirements)
- **Keeps security tight**: No public SELECT/UPDATE/DELETE access
- **Only allows INSERT** with valid data

---

## 📝 Full Documentation

See `docs/SILPANA-RLS-FIX.md` for complete details including:
- Admin policies
- User-owned data access
- Security considerations
- Troubleshooting guide

---

## ✅ Verification

After running the SQL, you should see:
1. ✅ No more 401 errors in console
2. ✅ Form submits successfully
3. ✅ Ticket code is generated
4. ✅ Success toast appears

---

**Need Help?** Check the full documentation in `docs/SILPANA-RLS-FIX.md`
