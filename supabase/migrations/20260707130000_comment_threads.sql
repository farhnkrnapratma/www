alter table public.comments
	add column if not exists parent_id uuid references public.comments(id) on delete cascade,
	add column if not exists is_anonymous boolean not null default false;

create index if not exists comments_post_parent_created_idx
	on public.comments (post_id, parent_id, created_at);

create index if not exists comments_parent_id_idx
	on public.comments (parent_id);

do $$
begin
	if not exists (
		select 1
		from pg_constraint
		where conname = 'comments_parent_not_self'
	) then
		alter table public.comments
			add constraint comments_parent_not_self check (parent_id is null or parent_id <> id);
	end if;
end $$;
