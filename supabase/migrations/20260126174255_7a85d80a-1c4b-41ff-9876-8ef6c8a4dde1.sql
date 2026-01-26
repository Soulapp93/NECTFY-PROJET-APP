-- Create storage bucket used by chat/messages attachments
insert into storage.buckets (id, name, public)
values ('module-files', 'module-files', true)
on conflict (id) do update set public = excluded.public;

-- Policies for module-files bucket
-- Public bucket: allow everyone to read objects
create policy "Public read module-files"
  on storage.objects
  for select
  using (bucket_id = 'module-files');

-- Allow authenticated users to upload attachments
create policy "Authenticated upload module-files"
  on storage.objects
  for insert
  with check (bucket_id = 'module-files' and auth.role() = 'authenticated');

-- Allow authenticated users to update their own uploads (optional)
create policy "Authenticated update module-files"
  on storage.objects
  for update
  using (bucket_id = 'module-files' and auth.role() = 'authenticated')
  with check (bucket_id = 'module-files' and auth.role() = 'authenticated');

-- Allow authenticated users to delete their own uploads (optional)
create policy "Authenticated delete module-files"
  on storage.objects
  for delete
  using (bucket_id = 'module-files' and auth.role() = 'authenticated');