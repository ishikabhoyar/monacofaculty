# Student Multiple Batch Membership

## Overview
Students can now belong to multiple batches simultaneously. This change removes the restriction that previously prevented a student from being enrolled in more than one batch.

## Changes Made

### Database Schema Changes
1. **Removed unique constraints** from the `students` table:
   - `UNIQUE(roll_number, batch_id)` - removed
   - `UNIQUE(email, batch_id)` - removed

2. **Migration Script**: `db/migrations/remove_student_unique_constraints.sql`
   - Drops existing unique constraints from the students table
   - Can be run on existing databases to update the schema

### Backend Logic Changes

#### `batchController.js`
1. **createBatch method**:
   - Removed validation that checks if students exist in other batches
   - Still validates for duplicates within the same submission
   - Students with the same email/roll number can now be added to different batches

2. **addStudent method**:
   - Removed unique constraint violation error handling
   - Students can be added to multiple batches with the same email/roll number

3. **updateStudent method**:
   - Removed unique constraint violation error handling
   - Student information can be updated without worrying about uniqueness across batches

4. **importStudents method**:
   - Removed unique constraint violation error messages
   - Students can be imported into multiple batches

## Migration Steps

To apply these changes to an existing database:

1. **Backup your database** before running any migrations:
   ```bash
   pg_dump -U your_username -d your_database > backup_$(date +%Y%m%d).sql
   ```

2. **Run the migration script**:
   ```bash
   psql -U your_username -d your_database -f db/migrations/remove_student_unique_constraints.sql
   ```

3. **Restart your backend server** to pick up the updated controller logic

## Use Cases

This change enables several new scenarios:

1. **Cross-semester enrollment**: A student can be in both "Fall 2024 - Data Structures" and "Fall 2024 - Algorithms" batches
2. **Multiple course sections**: A student can be enrolled in multiple sections of the same course
3. **Lab and lecture batches**: A student can be in separate batches for lab and lecture portions of a course
4. **Remedial batches**: A student can be in both regular and remedial batches simultaneously

## Validation Rules

### Still Enforced:
- No duplicate students within the same batch submission (roll number or email)
- Email format validation
- Roll number and name are required fields
- All original field length and format validations

### No Longer Enforced:
- ❌ Students cannot have the same roll number across different batches
- ❌ Students cannot have the same email across different batches

## API Behavior

All API endpoints continue to work as before, but with the following changes:

### POST `/api/batches` (Create Batch)
- ✅ Now accepts students who exist in other batches
- ✅ Still validates against duplicates within the submission

### POST `/api/batches/:id/students` (Add Student)
- ✅ Can add a student who already exists in other batches
- ✅ Same email/roll number can be used across batches

### PUT `/api/batches/:id/students/:studentId` (Update Student)
- ✅ No restrictions on email/roll number uniqueness across batches

### POST `/api/batches/:id/import-students` (Import Students)
- ✅ Can import students who exist in other batches

## Testing

After applying the migration, test the following scenarios:

1. Create a batch with a new student
2. Create another batch with the same student (same email and roll number)
3. Verify both batches show the student
4. Update the student in one batch
5. Verify the student in the other batch is independent (separate record)

## Notes

- Each student record in a batch is **independent**
- Updating a student's information in one batch does NOT update it in other batches
- Deleting a batch will only delete the student records associated with that specific batch
- Students are still uniquely identified by their `id` in the database

## Rollback

If you need to rollback this change:

1. Ensure no students exist in multiple batches:
   ```sql
   SELECT roll_number, email, COUNT(*) as batch_count
   FROM students
   GROUP BY roll_number, email
   HAVING COUNT(*) > 1;
   ```

2. Remove duplicates if any exist

3. Restore the unique constraints:
   ```sql
   ALTER TABLE students ADD CONSTRAINT students_roll_number_batch_id_key UNIQUE (roll_number, batch_id);
   ALTER TABLE students ADD CONSTRAINT students_email_batch_id_key UNIQUE (email, batch_id);
   ```
