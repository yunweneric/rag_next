# Database Migrations

This directory contains SQL migration scripts for the Swiss Legal Chat application.

## Migration: Add Email to Profiles Table

### File: `add_email_to_profiles.sql`

This migration adds an `email` column to the `profiles` table to store user email addresses locally.

### How to Run

1. **Via Supabase Dashboard:**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor
   - Copy and paste the contents of `add_email_to_profiles.sql`
   - Execute the script

2. **Via Supabase CLI:**
   ```bash
   supabase db reset
   # Then run the migration script
   ```

3. **Via psql (if you have direct database access):**
   ```bash
   psql -h your-db-host -U postgres -d postgres -f add_email_to_profiles.sql
   ```

### What This Migration Does

1. Adds an `email` column to the `profiles` table
2. Populates existing profiles with email addresses from `auth.users`
3. Sets the email column as NOT NULL
4. Adds a unique constraint on the email column

### Important Notes

- This migration assumes you have existing user data in `auth.users`
- The migration will fail if there are duplicate emails in `auth.users`
- Make sure to backup your database before running this migration
- Test the migration on a staging environment first

### After Migration

Update your application code to use the new schema. The `profiles` table will now include:
- `id` (string, primary key)
- `email` (string, unique, not null)
- `username` (string, nullable)
- `full_name` (string, nullable)
- `avatar_url` (string, nullable)
- `website` (string, nullable)
- `updated_at` (timestamp, nullable)
