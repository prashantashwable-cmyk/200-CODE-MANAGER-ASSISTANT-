-- The Owner decides platform decisions; Admin monitors. A new enum value cannot be used in the transaction that adds it,
-- so this migration only adds it and the next one uses it.
alter type public.app_role add value if not exists 'owner';
