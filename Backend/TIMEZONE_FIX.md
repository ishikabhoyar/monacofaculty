# Timezone Fix for Test Status Calculation

## Problem

Tests that should be showing as "Active" were appearing as "Upcoming" or locked in the student interface.

## Root Cause

The `tests` table has `start_time` and `end_time` columns defined as `timestamp without time zone`. This caused issues when comparing with PostgreSQL's `NOW()` function:

1. Test times were being stored in IST (India Standard Time, UTC+5:30)
2. `NOW()` returns the current timestamp with timezone (UTC by default)
3. PostgreSQL was comparing timestamps without proper timezone conversion
4. This caused the status calculation logic to fail

### Example
For a test with:
- Start: 22:57 IST (17:27 UTC)
- End: 23:57 IST (18:27 UTC)
- Current time: 23:05 IST (17:35 UTC)

The SQL was comparing:
- `22:57` <= `23:05` ❌ (comparing IST to UTC directly)

Instead of:
- `17:27` <= `17:35` ✅ (both in UTC)

## Solution

Modified the SQL query in `/api/students/tests` endpoint to explicitly convert timestamps to IST before comparison:

```sql
CASE
  WHEN t.end_time AT TIME ZONE 'Asia/Kolkata' < NOW() THEN 'Completed'
  WHEN t.start_time AT TIME ZONE 'Asia/Kolkata' <= NOW() 
    AND t.end_time AT TIME ZONE 'Asia/Kolkata' >= NOW() THEN 'Active'
  ELSE 'Upcoming'
END as status
```

The `AT TIME ZONE 'Asia/Kolkata'` operator tells PostgreSQL to interpret the timestamp as IST and convert it to UTC for comparison.

## Files Modified

- `monacofaculty/backend/routes/students.js` - Lines 125-185 (GET /tests endpoint)
  - Updated status calculation in both UNION clauses

## Testing

Run `node check-test-status.js` to verify the fix:

```bash
cd monacofaculty/backend
node check-test-status.js
```

This will show:
- Old Status (BROKEN) - The incorrect status before the fix
- New Status (FIXED) - The correct status after the fix

## Future Improvement

Consider migrating the database columns to `timestamp with time zone` (timestamptz) for better timezone handling:

```sql
ALTER TABLE tests 
  ALTER COLUMN start_time TYPE timestamptz USING start_time AT TIME ZONE 'Asia/Kolkata',
  ALTER COLUMN end_time TYPE timestamptz USING end_time AT TIME ZONE 'Asia/Kolkata';
```

This would eliminate the need for manual timezone conversion in queries.

## Restart Required

After applying this fix, restart the backend server:

```bash
cd monacofaculty/backend
npm start
```
