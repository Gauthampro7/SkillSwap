-- SkillSwap Database Schema for Supabase
-- Single file: run this entire script in the Supabase SQL Editor for a fresh project.
-- Creates: users, skills, trade_requests, saved_skills + RLS, indexes, triggers.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (Supabase Auth handles this, but we'll create a profiles table)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT,
  email TEXT,
  picture TEXT,
  university TEXT DEFAULT '',
  location TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add bio column if upgrading from an older schema
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';

-- Create skills table
CREATE TABLE IF NOT EXISTS public.skills (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Tech', 'Arts', 'Academic', 'Life Skills')),
  type TEXT NOT NULL CHECK (type IN ('Offering', 'Seeking')),
  location TEXT DEFAULT '',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_skills_user_id ON public.skills(user_id);
CREATE INDEX IF NOT EXISTS idx_skills_category ON public.skills(category);
CREATE INDEX IF NOT EXISTS idx_skills_type ON public.skills(type);
CREATE INDEX IF NOT EXISTS idx_skills_status ON public.skills(status);
CREATE INDEX IF NOT EXISTS idx_skills_created_at ON public.skills(created_at DESC);

-- Create full-text search index
CREATE INDEX IF NOT EXISTS idx_skills_search ON public.skills USING gin(to_tsvector('english', title || ' ' || description));

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
-- Anyone can read user profiles
CREATE POLICY "Users are viewable by everyone" ON public.users
  FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for skills table
-- Anyone can read active skills
CREATE POLICY "Skills are viewable by everyone" ON public.skills
  FOR SELECT USING (status = 'active');

-- Users can always read their own skills (any status)
CREATE POLICY "Users can view own skills" ON public.skills
  FOR SELECT USING (auth.uid() = user_id);

-- Authenticated users can create skills
CREATE POLICY "Authenticated users can create skills" ON public.skills
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- Users can update their own skills
CREATE POLICY "Users can update own skills" ON public.skills
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own skills
CREATE POLICY "Users can delete own skills" ON public.skills
  FOR DELETE USING (auth.uid() = user_id);

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email, picture)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.email,
    NEW.raw_user_meta_data->>'picture'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_skills_updated_at
  BEFORE UPDATE ON public.skills
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trade requests table
CREATE TABLE IF NOT EXISTS public.trade_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
  requester_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled', 'completed')),
  message TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(skill_id, requester_id)
);

CREATE INDEX IF NOT EXISTS idx_trade_requests_skill_id ON public.trade_requests(skill_id);
CREATE INDEX IF NOT EXISTS idx_trade_requests_requester_id ON public.trade_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_trade_requests_status ON public.trade_requests(status);

ALTER TABLE public.trade_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trade requests" ON public.trade_requests
  FOR SELECT USING (auth.uid() = requester_id);

CREATE POLICY "Skill owners can view requests on their skills" ON public.trade_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.skills WHERE skills.id = trade_requests.skill_id AND skills.user_id = auth.uid())
  );

CREATE POLICY "Authenticated users can create trade requests" ON public.trade_requests
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = requester_id);

CREATE POLICY "Requester can update own requests" ON public.trade_requests
  FOR UPDATE USING (auth.uid() = requester_id);

CREATE POLICY "Skill owner can update trade requests" ON public.trade_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.skills WHERE skills.id = trade_requests.skill_id AND skills.user_id = auth.uid())
  );

CREATE TRIGGER update_trade_requests_updated_at
  BEFORE UPDATE ON public.trade_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Ensure status constraint allows all five values (fix for DBs created before 'completed' was added)
ALTER TABLE public.trade_requests DROP CONSTRAINT IF EXISTS trade_requests_status_check;
ALTER TABLE public.trade_requests ADD CONSTRAINT trade_requests_status_check
  CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled', 'completed'));

-- Saved/bookmarked skills
CREATE TABLE IF NOT EXISTS public.saved_skills (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_skills_user_id ON public.saved_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_skills_skill_id ON public.saved_skills(skill_id);

ALTER TABLE public.saved_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved skills" ON public.saved_skills
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved skills" ON public.saved_skills
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved skills" ON public.saved_skills
  FOR DELETE USING (auth.uid() = user_id);

-- Trade chat: messages between requester and skill owner for an accepted trade
CREATE TABLE IF NOT EXISTS public.trade_chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trade_request_id UUID REFERENCES public.trade_requests(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 2000),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_trade_chat_messages_trade_request_id ON public.trade_chat_messages(trade_request_id);
CREATE INDEX IF NOT EXISTS idx_trade_chat_messages_created_at ON public.trade_chat_messages(created_at ASC);

ALTER TABLE public.trade_chat_messages ENABLE ROW LEVEL SECURITY;

-- Only the two parties (requester or skill owner) can read messages for that trade
CREATE POLICY "Trade parties can view chat messages" ON public.trade_chat_messages
  FOR SELECT USING (
    auth.uid() = sender_id
    OR EXISTS (
      SELECT 1 FROM public.trade_requests tr
      WHERE tr.id = trade_chat_messages.trade_request_id
      AND (tr.requester_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.skills s WHERE s.id = tr.skill_id AND s.user_id = auth.uid()
      ))
    )
  );

-- Only the two parties can send; sender_id must be self
CREATE POLICY "Trade parties can send chat messages" ON public.trade_chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.trade_requests tr
      WHERE tr.id = trade_chat_messages.trade_request_id
      AND tr.status = 'accepted'
      AND (tr.requester_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.skills s WHERE s.id = tr.skill_id AND s.user_id = auth.uid()
      ))
    )
  );

-- Optional: enable Realtime for live chat (Supabase Dashboard → Database → Replication → add trade_chat_messages)
