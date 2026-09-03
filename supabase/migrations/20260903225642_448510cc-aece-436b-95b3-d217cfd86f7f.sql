drop policy if exists "Users can update own social accounts" on public.social_accounts;

create policy "Users can update own social accounts"
on public.social_accounts
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);