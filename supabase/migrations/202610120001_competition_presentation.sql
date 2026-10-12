-- Additive presentation data only. No backfill, deletes, grants or policy changes.
-- Existing competition rows remain editions; seriesSlug groups related editions.
-- Publication remains governed by competition_result_sets.published and existing RLS.
alter table public.competitions
  add column presentation jsonb not null default '{}'::jsonb
  check (jsonb_typeof(presentation) = 'object' and octet_length(presentation::text) <= 16000);
alter table public.competition_result_sets
  add column presentation jsonb not null default '{}'::jsonb
  check (jsonb_typeof(presentation) = 'object' and octet_length(presentation::text) <= 16000);
alter table public.competition_results
  add column presentation jsonb not null default '{}'::jsonb
  check (jsonb_typeof(presentation) = 'object' and octet_length(presentation::text) <= 16000);
