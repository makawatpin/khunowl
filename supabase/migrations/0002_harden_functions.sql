-- Fix security-advisor warnings from 0001_init:
-- 1) pin search_path on SECURITY DEFINER/INVOKER functions
-- 2) move pg_trgm out of public schema
-- 3) stop anon/authenticated from calling handle_new_user() directly via PostgREST

create schema if not exists extensions;
alter extension pg_trgm set schema extensions;

create or replace function set_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles(user_id, display_name) values (new.id, split_part(new.email,'@',1));
  insert into accounts(user_id, name, type, bank) values (new.id, 'เงินสด', 'cash', 'cash');
  return new;
end $$;

revoke execute on function handle_new_user() from anon, authenticated;
