-- account_balances / card_usage views filter transactions by these columns in correlated
-- subqueries (one per account/card); without indexes each is a scan of the user's transactions.
create index if not exists transactions_src_account_idx on transactions(src_account_id) where src_account_id is not null;
create index if not exists transactions_src_card_idx    on transactions(src_card_id)    where src_card_id is not null;
create index if not exists transactions_to_account_idx  on transactions(to_account_id)  where to_account_id is not null;
create index if not exists transactions_to_card_idx     on transactions(to_card_id)     where to_card_id is not null;
