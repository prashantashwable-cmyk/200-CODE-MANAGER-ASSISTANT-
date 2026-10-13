-- S0c: where photos and documents will live instead of data URLs in memory. Both buckets are private:
-- a file is reached only through these policies. A person files under a folder named after their own
-- profile id; Admin reads everything in their world. Skipped where Supabase Storage does not exist.
do $$
begin
  if to_regclass('storage.buckets') is null then
    return;
  end if;
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
    ('evidence', 'evidence', false, 20971520, array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']),
    ('documents', 'documents', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png', 'text/html'])
  on conflict (id) do nothing;

  execute $p$create policy files_own_write on storage.objects for insert to authenticated
    with check (bucket_id in ('evidence', 'documents') and app.my_role() is not null
                and (storage.foldername(name))[1] = app.my_profile_id()::text)$p$;
  execute $p$create policy files_read on storage.objects for select to authenticated
    using (bucket_id in ('evidence', 'documents')
           and ((storage.foldername(name))[1] = app.my_profile_id()::text or app.is_admin()))$p$;
end $$;
