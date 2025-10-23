-- Swiss Legal Chat App Database Setup
-- This script creates all necessary tables, policies, and functions

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  website TEXT,
  email TEXT NOT NULL,
  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- Create chat conversations table
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  sources JSONB,
  citations JSONB,
  confidence DECIMAL,
  follow_ups JSONB,
  metrics JSONB,
  response_version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lawyers table
CREATE TABLE IF NOT EXISTS lawyers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  specialties TEXT[] NOT NULL,
  location TEXT,
  languages TEXT[],
  rating DECIMAL,
  experience_years INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

DROP POLICY IF EXISTS "Users can view own conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Users can create own conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Users can delete own conversations" ON chat_conversations;

DROP POLICY IF EXISTS "Users can view messages in own conversations" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert messages in own conversations" ON chat_messages;
DROP POLICY IF EXISTS "Users can update messages in own conversations" ON chat_messages;
DROP POLICY IF EXISTS "Users can delete messages in own conversations" ON chat_messages;

DROP POLICY IF EXISTS "Lawyers are viewable by everyone" ON lawyers;

-- Create policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" ON profiles 
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles 
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update own profile" ON profiles 
  FOR UPDATE USING ((SELECT auth.uid()) = id);

-- Create policies for conversations
CREATE POLICY "Users can view own conversations" ON chat_conversations 
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create own conversations" ON chat_conversations 
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own conversations" ON chat_conversations 
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own conversations" ON chat_conversations 
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- Create policies for messages
CREATE POLICY "Users can view messages in own conversations" ON chat_messages 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_conversations 
      WHERE chat_conversations.id = chat_messages.conversation_id 
      AND chat_conversations.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert messages in own conversations" ON chat_messages 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_conversations 
      WHERE chat_conversations.id = chat_messages.conversation_id 
      AND chat_conversations.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update messages in own conversations" ON chat_messages 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM chat_conversations 
      WHERE chat_conversations.id = chat_messages.conversation_id 
      AND chat_conversations.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete messages in own conversations" ON chat_messages 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM chat_conversations 
      WHERE chat_conversations.id = chat_messages.conversation_id 
      AND chat_conversations.user_id = (SELECT auth.uid())
    )
  );

-- Create policies for lawyers (public read access)
CREATE POLICY "Lawyers are viewable by everyone" ON lawyers 
  FOR SELECT USING (true);

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS handle_updated_at ON profiles;
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON chat_conversations;
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON chat_conversations
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Insert sample lawyers data
INSERT INTO lawyers (name, email, phone, specialties, location, languages, rating, experience_years, website) VALUES
('Dr. Maria Müller', 'maria.muller@law.ch', '+41 44 123 4567', ARRAY['Family Law', 'Divorce'], 'Zurich', ARRAY['German', 'English', 'French'], 4.8, 15, 'https://www.mariamuller-law.ch'),
('Dr. Jean-Pierre Dubois', 'jp.dubois@law.ch', '+41 21 987 6543', ARRAY['Corporate Law', 'Contract Law'], 'Geneva', ARRAY['French', 'English', 'Italian'], 4.6, 12, 'https://www.dubois-law.ch'),
('Dr. Anna Rossi', 'anna.rossi@law.ch', '+41 91 555 1234', ARRAY['Criminal Law', 'Immigration Law'], 'Lugano', ARRAY['Italian', 'German', 'English'], 4.9, 18, 'https://www.rossi-law.ch'),
('Dr. Michael Weber', 'michael.weber@law.ch', '+41 31 789 0123', ARRAY['Real Estate Law', 'Construction Law'], 'Bern', ARRAY['German', 'French'], 4.5, 10, 'https://www.weber-law.ch'),
('Dr. Sophie Laurent', 'sophie.laurent@law.ch', '+41 27 456 7890', ARRAY['Tax Law', 'Estate Planning'], 'Sion', ARRAY['French', 'German'], 4.7, 14, 'https://www.laurent-law.ch')
ON CONFLICT (email) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_lawyers_specialties ON lawyers USING GIN(specialties);
CREATE INDEX IF NOT EXISTS idx_lawyers_location ON lawyers(location);
