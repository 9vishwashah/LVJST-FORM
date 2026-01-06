# Supabase occupation_type NULL Issue - Diagnostic Guide

## Problem
`occupation_type` field is being sent from frontend and included in backend insert, but stores as NULL in Supabase database.

## Quick Fixes to Try (In Order)

### 1. Check Column Configuration in Supabase Dashboard
**Step 1:** Go to Supabase Dashboard → Your Project → SQL Editor

**Step 2:** Run this query to see the column definition:
```sql
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'volunteers' AND column_name = 'occupation_type';
```

**Expected Result:** Should show `occupation_type | text | NO (false) or YES (true) | null`

If column shows as "YES" for is_nullable, that's fine. If it shows something unexpected, that's the problem.

---

### 2. Check RLS (Row Level Security) Policies
**Step 1:** Go to Supabase Dashboard → Authentication → Policies

**Step 2:** Check if there's an INSERT policy on the `volunteers` table

**Step 3:** If a policy exists, make sure it allows all columns including `occupation_type`

**If RLS is preventing inserts:**
- Temporarily disable RLS: Go to `volunteers` table → click "⚙️" → toggle "Enable RLS" OFF
- Test form submission
- If it works, you need to create proper RLS policies

---

### 3. Check for Triggers or Constraints
**Run this query in Supabase SQL Editor:**
```sql
-- Check for triggers on the volunteers table
SELECT trigger_name, event_object_table, event_manipulation 
FROM information_schema.triggers 
WHERE event_object_table = 'volunteers';

-- Check for constraints on occupation_type column
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'volunteers' 
  AND constraint_name LIKE '%occupation%';
```

If there are triggers that might be clearing the value, that's the issue.

---

### 4. Test Direct Insert (Verify Database Permissions)
**Run this in Supabase SQL Editor:**
```sql
INSERT INTO volunteers (
  full_name, 
  email, 
  mobile_number, 
  gender, 
  age,
  occupation_type,
  occupation_detail,
  city,
  address,
  reference
) VALUES (
  'Test User',
  'test@example.com',
  '9999999999',
  'Male',
  25,
  'Student',
  'College Student',
  'Test City',
  'Test Address',
  'Test Reference'
);

-- Then verify:
SELECT id, full_name, occupation_type, occupation_detail 
FROM volunteers 
WHERE email = 'test@example.com' 
ORDER BY id DESC LIMIT 1;
```

**If occupation_type is NULL:** Database column/permissions issue
**If occupation_type shows "Student":** Backend is the problem

---

### 5. Most Likely Fix: Column Data Type Issue

The column might have been created with wrong type. Fix it:

```sql
-- First, check current type
SELECT data_type FROM information_schema.columns 
WHERE table_name = 'volunteers' AND column_name = 'occupation_type';

-- If it's not 'text' or 'character varying', alter it:
ALTER TABLE volunteers 
MODIFY COLUMN occupation_type TEXT NULL;

-- Or if using PostgreSQL (which Supabase uses):
ALTER TABLE volunteers 
ALTER COLUMN occupation_type TYPE text;
```

---

### 6. If Nothing Works: Recreate the Column

```sql
-- Backup existing data (if any)
SELECT occupation_type FROM volunteers LIMIT 10;

-- Drop and recreate
ALTER TABLE volunteers DROP COLUMN occupation_type;
ALTER TABLE volunteers ADD COLUMN occupation_type text;

-- Verify
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'volunteers' AND column_name = 'occupation_type';
```

---

## Debugging Steps

After implementing a fix:

1. **Check backend logs:**
   - Go to Netlify Dashboard → Functions → submitVolunteer
   - Look at recent invocations to see the console.log output
   - You should see:
     ```
     Incoming occupation_type: Student
     Incoming occupation_detail: College Student
     Insert payload occupation fields: { occupation_type: 'Student', occupation_detail: 'College Student' }
     ```

2. **Test form submission** with valid data:
   - Fill out form with "Student" or "Working"
   - Submit form
   - Check Supabase table immediately

3. **Check the inserted row:**
   ```sql
   SELECT id, full_name, email, occupation_type, occupation_detail, "Timestamp"
   FROM volunteers 
   ORDER BY "Timestamp" DESC 
   LIMIT 5;
   ```

---

## Expected Working Flow

Frontend → script.js collects `occupation_type` from radio button → sends to backend → submitVolunteer.js receives and logs it → inserts into database → Supabase stores the value

If data is NULL at any step:
- **NULL in console.log:** Frontend not sending it
- **NULL in insertPayload log:** Backend not processing it
- **NULL in database but logs show value:** Supabase column/permissions issue

---

## Contact Support If Needed
If you've tried all these steps and it still doesn't work:
- Supabase Support can check database logs
- Ask them to verify column permissions and RLS policies on `volunteers` table
- Mention: "New column occupation_type created via migration, inserts fail silently"
