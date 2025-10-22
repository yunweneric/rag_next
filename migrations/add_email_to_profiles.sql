-- Add email column to profiles table
ALTER TABLE profiles ADD COLUMN email TEXT NOT NULL DEFAULT '';

-- Update existing profiles with email from auth.users
UPDATE profiles 
SET email = au.email 
FROM auth.users au 
WHERE profiles.id = au.id;

-- Make email column NOT NULL after updating existing records
ALTER TABLE profiles ALTER COLUMN email SET NOT NULL;

-- Add unique constraint on email
ALTER TABLE profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);
