-- 1. Table des Profils (Liée à l'authentification)
create table public.profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  avatar_url text,
  total_xp int default 0,
  total_distance_km float default 0,
  currency_shadow_coins int default 0,
  
  constraint username_length check (char_length(username) >= 3)
);

-- Active la sécurité (RLS)
alter table public.profiles enable row level security;

-- Tout le monde peut voir les profils (pour les classements), mais seul l'utilisateur peut modifier le sien
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- 2. Table des Courses (Runs)
create table public.runs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  mode text check (mode in ('WALK', 'RUN')), -- MARCHE ou COURSE
  status text check (status in ('EXTRACTED', 'CAUGHT', 'SURVIVED')),
  
  distance_meters float not null,
  duration_seconds int not null,
  avg_speed_kmh float,
  shadow_base_speed int, -- 5 ou 15 selon le mode
  
  points_earned int default 0,
  rewards_json jsonb -- Pour stocker les bonus obtenus
);

alter table public.runs enable row level security;

-- Un joueur ne voit que ses propres courses
create policy "Users can see own runs."
  on runs for select
  using ( auth.uid() = user_id );

create policy "Users can insert own runs."
  on runs for insert
  with check ( auth.uid() = user_id );

-- 3. Trigger automatique : Quand un utilisateur s'inscrit, on crée son profil
create function public.handle_new_user() 
returns trigger 
language plpgsql 
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'avatar_url');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
