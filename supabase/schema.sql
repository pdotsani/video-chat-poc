-- Profiles table: one row per user who has logged in
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now() not null
);

-- Items table: each item has a creator and a single recipient
create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references profiles(id) on delete cascade,
  recipient_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz default now() not null
);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table items enable row level security;

-- Profiles: any authenticated user can read all profiles (for the recipient dropdown)
create policy "Authenticated users can read profiles"
  on profiles for select
  to authenticated
  using (true);

-- Profiles: users can only insert/update their own profile
create policy "Users can upsert own profile"
  on profiles for insert
  to authenticated
  with check (id = auth.uid());

create policy "Users can update own profile"
  on profiles for update
  to authenticated
  using (id = auth.uid());

-- Items: visible only to the creator or the designated recipient
create policy "Items visible to creator or recipient"
  on items for select
  to authenticated
  using (creator_id = auth.uid() or recipient_id = auth.uid());

-- Items: only the creator can insert
create policy "Creators can insert items"
  on items for insert
  to authenticated
  with check (creator_id = auth.uid());

-- Items: only the creator can delete
create policy "Creators can delete items"
  on items for delete
  to authenticated
  using (creator_id = auth.uid());
