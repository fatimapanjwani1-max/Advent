-- Supabase SQL Schema for Advent SmartSite

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin', 'project_manager', 'client')) NOT NULL DEFAULT 'client',
  company_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Projects Table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  client_id UUID REFERENCES profiles(id) NOT NULL,
  project_manager_id UUID REFERENCES profiles(id),
  location TEXT,
  start_date DATE,
  estimated_completion DATE,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  status TEXT CHECK (status IN ('planning', 'active', 'completed', 'delayed')) NOT NULL DEFAULT 'planning',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Milestones Table
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'completed')) NOT NULL DEFAULT 'pending',
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Photos Table
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Invoices Table
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'paid', 'overdue')) NOT NULL DEFAULT 'pending',
  issued_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Budgets Table
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  amount_allocated DECIMAL(12, 2) NOT NULL,
  amount_used DECIMAL(12, 2) DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security (RLS) Setup

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);

-- Projects Policies
CREATE POLICY "Admins can view all projects" ON projects FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Project Managers can view assigned projects" ON projects FOR SELECT USING (
  project_manager_id = auth.uid()
);
CREATE POLICY "Clients can view their own projects" ON projects FOR SELECT USING (
  client_id = auth.uid()
);
CREATE POLICY "Admins can insert projects" ON projects FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins and PMs can update projects" ON projects FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'project_manager'))
);

-- Milestones Policies
CREATE POLICY "Users can view milestones for their projects" ON milestones FOR SELECT USING (
  EXISTS (SELECT 1 FROM projects WHERE id = milestones.project_id AND (client_id = auth.uid() OR project_manager_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')))
);
CREATE POLICY "Admins and PMs can manage milestones" ON milestones FOR ALL USING (
  EXISTS (SELECT 1 FROM projects WHERE id = milestones.project_id AND (project_manager_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')))
);

-- Photos Policies
CREATE POLICY "Users can view photos for their projects" ON photos FOR SELECT USING (
  EXISTS (SELECT 1 FROM projects WHERE id = photos.project_id AND (client_id = auth.uid() OR project_manager_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')))
);
CREATE POLICY "Admins and PMs can manage photos" ON photos FOR ALL USING (
  EXISTS (SELECT 1 FROM projects WHERE id = photos.project_id AND (project_manager_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')))
);

-- Invoices Policies
CREATE POLICY "Users can view invoices for their projects" ON invoices FOR SELECT USING (
  EXISTS (SELECT 1 FROM projects WHERE id = invoices.project_id AND (client_id = auth.uid() OR project_manager_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')))
);
CREATE POLICY "Admins and PMs can manage invoices" ON invoices FOR ALL USING (
  EXISTS (SELECT 1 FROM projects WHERE id = invoices.project_id AND (project_manager_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')))
);

-- Budgets Policies
CREATE POLICY "Users can view budgets for their projects" ON budgets FOR SELECT USING (
  EXISTS (SELECT 1 FROM projects WHERE id = budgets.project_id AND (client_id = auth.uid() OR project_manager_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')))
);
CREATE POLICY "Admins and PMs can manage budgets" ON budgets FOR ALL USING (
  EXISTS (SELECT 1 FROM projects WHERE id = budgets.project_id AND (project_manager_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')))
);

-- Storage Setup
-- You need to create a storage bucket named 'smartsite-assets' in the Supabase dashboard.
-- Set it to public if you want direct access to images, or private with RLS for secure access.
