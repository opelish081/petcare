-- ============================================================
-- supabase/schema.sql
-- รันไฟล์นี้ใน Supabase SQL Editor เพื่อสร้าง Database
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLE: profiles
-- เก็บข้อมูลเพิ่มเติมของ user (ต่อจาก Supabase Auth)
-- ============================================================
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  email       text not null,
  avatar_url  text,
  locale      text not null default 'th',
  created_at  timestamptz not null default now()
);

-- ============================================================
-- TABLE: pets
-- เก็บข้อมูลสัตว์เลี้ยงของแต่ละ user
-- ============================================================
create table public.pets (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  name        text not null,
  type        text not null check (type in ('dog','cat','rabbit','bird','fish','other')),
  breed       text,
  birthdate   date,
  gender      text check (gender in ('male','female')),
  image_url   text,
  notes       text,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- TABLE: appointments
-- เก็บนัดหมายสัตว์เลี้ยง
-- ============================================================
create table public.appointments (
  id                uuid primary key default uuid_generate_v4(),
  pet_id            uuid not null references public.pets(id) on delete cascade,
  user_id           uuid not null references public.profiles(id) on delete cascade,
  type              text not null check (type in ('vet','vaccine','grooming','other')),
  title             text not null,
  appointment_date  timestamptz not null,
  location          text,
  status            text not null default 'pending' check (status in ('pending','completed','cancelled')),
  notes             text,
  notify_days       int[] not null default '{1,2,3}',
  created_at        timestamptz not null default now()
);

-- ============================================================
-- TABLE: health_records
-- เก็บประวัติสุขภาพ สร้างอัตโนมัติเมื่อนัดหมาย "completed"
-- ============================================================
create table public.health_records (
  id              uuid primary key default uuid_generate_v4(),
  pet_id          uuid not null references public.pets(id) on delete cascade,
  appointment_id  uuid references public.appointments(id) on delete set null,
  type            text not null check (type in ('vaccine','checkup','grooming','treatment','other')),
  title           text not null,
  record_date     date not null,
  details         text,
  next_due_date   date,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- TABLE: email_logs
-- เก็บ log การส่ง email ป้องกันส่งซ้ำ
-- ============================================================
create table public.email_logs (
  id              uuid primary key default uuid_generate_v4(),
  appointment_id  uuid not null references public.appointments(id) on delete cascade,
  days_before     int not null,
  sent_at         timestamptz not null default now(),
  status          text not null check (status in ('sent','failed')),
  unique (appointment_id, days_before)  -- ป้องกัน log ซ้ำ
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- แต่ละ user เห็นได้เฉพาะข้อมูลของตัวเอง
-- ============================================================

alter table public.profiles       enable row level security;
alter table public.pets           enable row level security;
alter table public.appointments   enable row level security;
alter table public.health_records enable row level security;
alter table public.email_logs     enable row level security;

-- profiles: เห็นและแก้ไขได้เฉพาะของตัวเอง
create policy "profiles: owner only"
  on public.profiles for all
  using (auth.uid() = id);

-- pets: เห็นและแก้ไขได้เฉพาะของตัวเอง
create policy "pets: owner only"
  on public.pets for all
  using (auth.uid() = user_id);

-- appointments: เห็นและแก้ไขได้เฉพาะของตัวเอง
create policy "appointments: owner only"
  on public.appointments for all
  using (auth.uid() = user_id);

-- health_records: เห็นได้ผ่าน pet ที่เป็นเจ้าของ
create policy "health_records: owner only"
  on public.health_records for all
  using (
    exists (
      select 1 from public.pets
      where pets.id = health_records.pet_id
        and pets.user_id = auth.uid()
    )
  );

-- email_logs: service role เท่านั้น (Cron job ใช้)
create policy "email_logs: service role only"
  on public.email_logs for all
  using (auth.role() = 'service_role');

-- ============================================================
-- FUNCTION: auto create profile เมื่อ user สมัครใหม่
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- STORAGE: bucket สำหรับรูปสัตว์เลี้ยง
-- ============================================================
insert into storage.buckets (id, name, public)
values ('pet-images', 'pet-images', true);

create policy "pet-images: anyone can view"
  on storage.objects for select
  using (bucket_id = 'pet-images');

create policy "pet-images: owner can upload"
  on storage.objects for insert
  with check (bucket_id = 'pet-images' and auth.uid() is not null);

create policy "pet-images: owner can delete"
  on storage.objects for delete
  using (bucket_id = 'pet-images' and auth.uid() is not null);
