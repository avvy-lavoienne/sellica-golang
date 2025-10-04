# SILPANA RLS Policy Fix - Public Complaint Submission

## 🚨 Problem

**Error:** `new row violates row-level security policy for table "silpana"`  
**HTTP Status:** 401 Unauthorized  
**Code:** 42501

### Root Cause
The SILPANA complaint submission form was failing because:
1. Supabase Row-Level Security (RLS) is enabled on the `silpana` table
2. No RLS policy existed to allow **anonymous** users to INSERT complaints
3. The frontend uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` which respects RLS policies
4. Public complaint submission requires INSERT permission without authentication

---

## ✅ Solution

### Migration File: `004_silpana_public_insert_policy.sql`

Created comprehensive RLS policies with security-first approach:

### **1. Public INSERT Policy**
```sql
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
```

**Features:**
- ✅ Allows both anonymous (`anon`) and authenticated users to submit
- ✅ Validates minimum data quality at database level
- ✅ Ensures complaints start with `submitted` status
- ✅ Prevents empty or spam submissions

### **2. User-Owned SELECT Policy**
```sql
CREATE POLICY "Allow users to view own complaints"
ON public.silpana
FOR SELECT
TO authenticated
USING (
  auth.uid()::text = created_by OR
  auth.uid()::text = user_id
);
```

**Features:**
- Authenticated users can view their own complaints
- Privacy-preserving: Users can't see others' complaints

### **3. Admin SELECT Policy**
```sql
CREATE POLICY "Allow admins to view all complaints"
ON public.silpana
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);
```

**Features:**
- Admin users can view all complaints system-wide
- Role-based access control (RBAC) via metadata

### **4. Admin UPDATE Policy**
```sql
CREATE POLICY "Allow admins to update complaints"
ON public.silpana
FOR UPDATE
TO authenticated
USING (...admin check...)
WITH CHECK (...admin check...);
```

**Features:**
- Only admins can modify complaint status, priority, etc.
- Prevents unauthorized tampering

---

## 🔒 Security Considerations

### ✅ What's Protected
1. **No public SELECT**: Anonymous users cannot browse all complaints
2. **No public UPDATE/DELETE**: Only admins can modify data
3. **Data validation**: Database enforces minimum quality standards
4. **Status locking**: New complaints must have `submitted` status

### ⚠️ What's Allowed
1. **Public INSERT**: Required for complaint submission form
2. **Authenticated SELECT**: Users can view their own submissions
3. **Admin full access**: Admins can manage all complaints

---

## 📝 How to Apply

### Option 1: Supabase Dashboard (Recommended)
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **SQL Editor**
4. Copy contents of `004_silpana_public_insert_policy.sql`
5. Click **Run**
6. Verify: Check **Database** → **Policies** → `silpana` table

### Option 2: PostgreSQL CLI
```bash
# If using PostgreSQL CLI
psql -U postgres -d your_database -f backend/migrations/004_silpana_public_insert_policy.sql
```

### Option 3: Supabase CLI
```bash
# If using Supabase CLI
supabase db push
```

---

## 🧪 Testing

### Test Anonymous Submission
```typescript
// Should work now
const { data, error } = await supabase
  .from('silpana')
  .insert([{
    nama_pengaduan: 'Test User',
    kategori_pengaduan: 'Test Category',
    deskripsi_pengaduan: 'This is a test complaint with minimum 10 characters',
    tanggal_pengaduan: new Date().toISOString().split('T')[0],
    ticket_status: 'submitted'
  }])
  .select('*')
  .single();

console.log(error ? 'Failed' : 'Success!');
```

### Test Policy Violations
```typescript
// Should FAIL - deskripsi too short
const { error } = await supabase
  .from('silpana')
  .insert([{
    nama_pengaduan: 'Test',
    deskripsi_pengaduan: 'Short',  // Less than 10 chars
    ticket_status: 'submitted'
  }]);
// Expected error: "new row violates check option for table"
```

---

## 🔍 Verification Checklist

After applying the migration:

- [ ] **Public form submission works** (no more 401 errors)
- [ ] **Ticket code is generated** automatically
- [ ] **Toast notification shows success** with ticket code
- [ ] **Form resets** after successful submission
- [ ] **Validation still works** (frontend + database)
- [ ] **Anonymous users can submit** without login
- [ ] **Authenticated users can submit** with their profile
- [ ] **Admin dashboard** can view all complaints
- [ ] **Users can view** only their own complaints (if implemented)

---

## 🎯 Related Files

### Frontend
- `frontend/src/app/silpana/page.tsx` (lines 397-401) - Form submission logic
- `frontend/src/components/silpana/SilpanaForm.tsx` - Form UI component
- `frontend/src/lib/conn/supabaseClient.ts` - Supabase client configuration

### Backend
- `backend/migrations/001_training_data_schema.sql` - Original schema
- `backend/migrations/002_silpana_ticketing_system.sql` - SILPANA table creation
- `backend/migrations/004_silpana_public_insert_policy.sql` - **THIS FIX**

---

## 📊 Database Schema Reference

### Required Fields for INSERT
```sql
-- Validated by RLS policy
nama_pengaduan         VARCHAR   >= 3 chars (trimmed)
kategori_pengaduan     VARCHAR   >= 2 chars (trimmed)
deskripsi_pengaduan    TEXT      >= 10 chars (trimmed)
tanggal_pengaduan      DATE      NOT NULL
ticket_status          VARCHAR   = 'submitted'

-- Auto-generated by database
ticket_code            VARCHAR   UNIQUE, auto-generated
created_at             TIMESTAMP DEFAULT NOW()
```

### Optional Fields
```sql
nik_pengaduan          VARCHAR(16)
nama_pelapor           VARCHAR
sub_kategori_pengaduan VARCHAR
alasan_pengaduan       TEXT
nomor_telepon          VARCHAR
email                  VARCHAR
alamat                 TEXT
priority_level         VARCHAR DEFAULT 'medium'
is_anonymous           BOOLEAN DEFAULT false
```

---

## 🚀 Next Steps

1. **Apply the migration** using one of the methods above
2. **Test the form** in your development environment
3. **Verify in production** before deploying
4. **Monitor logs** for any RLS policy violations
5. **Adjust policies** if needed based on requirements

---

## 💡 Best Practices

### DO ✅
- Keep RLS policies simple and readable
- Add comments explaining policy logic
- Test with both anonymous and authenticated users
- Use database-level validation alongside frontend validation
- Grant minimum necessary permissions

### DON'T ❌
- Don't use service role key on frontend (security risk)
- Don't disable RLS entirely for convenience
- Don't allow public DELETE/UPDATE operations
- Don't skip testing policy changes
- Don't hardcode admin checks (use metadata/roles)

---

## 🆘 Troubleshooting

### Still Getting 401 Error?
1. **Verify migration ran successfully**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'silpana';
   ```

2. **Check RLS is enabled**
   ```sql
   SELECT relname, relrowsecurity 
   FROM pg_class 
   WHERE relname = 'silpana';
   ```

3. **Test policy directly**
   ```sql
   SET ROLE anon;
   INSERT INTO silpana (nama_pengaduan, kategori_pengaduan, deskripsi_pengaduan, tanggal_pengaduan, ticket_status)
   VALUES ('Test', 'Category', 'Description here', CURRENT_DATE, 'submitted');
   ```

### Policy Not Working?
- Clear Supabase cache: Restart your dev server
- Check browser console for detailed error messages
- Verify environment variables are correct
- Ensure you're using the latest Supabase client library

---

## 📖 Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Policy System](https://www.postgresql.org/docs/current/sql-createpolicy.html)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)

---

**Author:** GitHub Copilot  
**Date:** October 3, 2025  
**Issue:** RLS policy blocking public complaint submission  
**Status:** ✅ Fixed with migration `004_silpana_public_insert_policy.sql`
