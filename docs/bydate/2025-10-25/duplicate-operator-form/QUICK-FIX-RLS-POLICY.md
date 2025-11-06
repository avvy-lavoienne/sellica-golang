# QUICK FIX - Copy & Paste into Supabase

## Problem
❌ Duplicate operator update returns HTTP 200 but data doesn't save  
❌ Frontend error: "Cannot read properties of undefined (reading 'id')"  
❌ RLS policy uses non-existent `auth.user_role()` function

## Solution
✅ Execute this SQL in Supabase → SQL Editor → Run

```sql
DROP POLICY IF EXISTS "Users can update their own duplicate_operator records" ON duplicate_operator;

CREATE POLICY "Users can update their own duplicate_operator records"
ON duplicate_operator
FOR UPDATE
USING (
  (auth.uid() = user_id)
  OR
  (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ))
)
WITH CHECK (
  (auth.uid() = user_id)
  OR
  (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ))
);
```

## After Running
1. ✅ Check policy created: `SELECT * FROM pg_policies WHERE tablename='duplicate_operator' AND cmd='UPDATE';`
2. ✅ Test frontend: Go to Data Rekam → Duplikat Operator → Edit any record → Click "Perbarui Data"
3. ✅ Verify: Should see "Catatan berhasil diperbarui" toast and data persists after refresh

## Time to Fix: 5 minutes
