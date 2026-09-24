-- Stories and the people in them ship with the app (src/data.ts). The database
-- stores what users do with them, keyed by the ids used in that file.

create type public.gender as enum ('Female', 'Male', 'Other');

create function public.word_count(value text)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case
    when btrim(value) = '' then 0
    else array_length(regexp_split_to_array(btrim(value), '\s+'), 1)
  end
$$;

-- App users and seeded commenters. Seeded rows have no auth user, so there is
-- no foreign key to auth.users.
create table public.profiles (
  id uuid primary key,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  gender public.gender not null,
  location text not null check (char_length(location) <= 80),
  profession text not null check (char_length(profession) <= 80),
  bio text not null check (char_length(bio) <= 1000 and public.word_count(bio) <= 120),
  avatar_path text not null,
  updated_at timestamptz not null default now()
);

-- One row per follow edge. Ids are auth user ids or person ids from src/data.ts,
-- so the same table answers both "followers" and "following".
create table public.follows (
  follower_id text not null,
  followee_id text not null,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

create index follows_followee_id_idx on public.follows (followee_id);

create table public.story_likes (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  story_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, story_id)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  story_id text not null,
  author_id uuid not null default auth.uid() references public.profiles on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 500),
  created_at timestamptz not null default now()
);

create index comments_story_id_created_at_idx on public.comments (story_id, created_at);
create index comments_author_id_idx on public.comments (author_id);

create table public.comment_likes (
  comment_id uuid not null references public.comments on delete cascade,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

create index comment_likes_user_id_idx on public.comment_likes (user_id);

alter table public.profiles enable row level security;
alter table public.follows enable row level security;
alter table public.story_likes enable row level security;
alter table public.comments enable row level security;
alter table public.comment_likes enable row level security;

grant select, update on public.profiles to authenticated;
grant select, insert, delete on public.follows, public.story_likes, public.comments, public.comment_likes to authenticated;

create policy "Profiles are readable by signed-in users"
  on public.profiles for select to authenticated using (true);
create policy "Users update their own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "Users read their own follow edges"
  on public.follows for select to authenticated
  using ((select auth.uid())::text in (follower_id, followee_id));
create policy "Users follow as themselves"
  on public.follows for insert to authenticated
  with check (follower_id = (select auth.uid())::text);
create policy "Users unfollow or remove their followers"
  on public.follows for delete to authenticated
  using ((select auth.uid())::text in (follower_id, followee_id));

create policy "Users read their own story likes"
  on public.story_likes for select to authenticated using (user_id = (select auth.uid()));
create policy "Users like as themselves"
  on public.story_likes for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Users remove their own story likes"
  on public.story_likes for delete to authenticated using (user_id = (select auth.uid()));

create policy "Comments are readable by signed-in users"
  on public.comments for select to authenticated using (true);
create policy "Users comment as themselves"
  on public.comments for insert to authenticated with check (author_id = (select auth.uid()));
create policy "Users delete their own comments"
  on public.comments for delete to authenticated using (author_id = (select auth.uid()));

create policy "Comment likes are readable by signed-in users"
  on public.comment_likes for select to authenticated using (true);
create policy "Users like comments as themselves"
  on public.comment_likes for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Users remove their own comment likes"
  on public.comment_likes for delete to authenticated using (user_id = (select auth.uid()));

create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Every new install starts as the demo profile from the assignment, with the
-- same followers and following as the reference screens.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name, gender, location, profession, bio, avatar_path)
  values (
    new.id,
    'Neha Sharma',
    'Female',
    'Greater noida',
    'Anchor',
    'Independent reporter covering stories from the community.',
    'defaults/neha-sharma.png'
  );

  insert into public.follows (follower_id, followee_id)
  select person_id, new.id::text
  from unnest(array['noishina', 'riya', 'arjun', 'anaya']) as person_id
  union all
  select new.id::text, 'nidhi-gupta';

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp']);

-- Avatars live at avatars/<user id>/avatar. Upserting needs select and update too.
create policy "Users upload their own avatar"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users read their own avatar object"
  on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users replace their own avatar"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

insert into public.profiles (id, name, gender, location, profession, bio, avatar_path)
values (
  '00000000-0000-4000-8000-000000000001',
  'Priya chauhan',
  'Female',
  'Noida',
  'Student',
  '',
  'defaults/priya-chauhan.png'
);

insert into public.comments (story_id, author_id, body, created_at)
values (
  'kappan-story',
  '00000000-0000-4000-8000-000000000001',
  'We wanted this!!!!',
  '2026-07-07 10:30:00+05:30'
);
