-- Create profiles table
create table public.profiles (
  id uuid references auth.users not null primary key,
  full_name text,
  email text,
  mobile text,
  age integer,
  gender text,
  address text,
  city text,
  taluka text,
  is_admin boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Create surveys table
create table public.surveys (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  derasar_name text,
  location_name text,
  full_address text,
  state text,
  district text,
  taluka text,
  gmapping_location text,
  pedhi_manager_name text,
  pedhi_manager_mobile text,
  poojari_name text,
  poojari_mobile text,
  mulnayak_name text,
  mulnayak_photo_url text,
  jinalay_photo_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on surveys
alter table public.surveys enable row level security;

create policy "Users can view own surveys."
  on surveys for select
  using ( auth.uid() = user_id );

create policy "Admins can view all surveys."
  on surveys for select
  using ( exists ( select 1 from profiles where id = auth.uid() and is_admin = true ) );

create policy "Users can insert own surveys."
  on surveys for insert
  with check ( auth.uid() = user_id );

-- Create trustees table
create table public.trustees (
  id uuid default uuid_generate_v4() primary key,
  survey_id uuid references public.surveys(id) on delete cascade not null,
  name text,
  mobile text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on trustees
alter table public.trustees enable row level security;

create policy "Users can view own survey trustees."
  on trustees for select
  using ( exists ( select 1 from surveys where id = survey_id and user_id = auth.uid() ) );

create policy "Admins can view all trustees."
  on trustees for select
  using ( exists ( select 1 from profiles where id = auth.uid() and is_admin = true ) );

create policy "Users can insert trustees for own surveys."
  on trustees for insert
  with check ( exists ( select 1 from surveys where id = survey_id and user_id = auth.uid() ) );

-- Storage buckets setup (run these via dashboard or storage API usually, but SQL for reference)
-- insert into storage.buckets (id, name) values ('jinalay-photos', 'jinalay-photos');
-- insert into storage.buckets (id, name) values ('mulnayak-photos', 'mulnayak-photos');

-- Storage Policies
-- create policy "Authenticated users can upload images."
-- on storage.objects for insert
-- with check ( bucket_id in ('jinalay-photos', 'mulnayak-photos') and auth.role() = 'authenticated' );

-- create policy "Images are publicly accessible."
-- on storage.objects for select
-- using ( bucket_id in ('jinalay-photos', 'mulnayak-photos') );
