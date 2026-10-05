-- 0002 revoked execute from anon/authenticated, but CREATE OR REPLACE FUNCTION
-- had already re-granted EXECUTE to the PUBLIC pseudo-role (the Postgres
-- default), which anon/authenticated inherit from. Revoke from PUBLIC directly.
revoke execute on function handle_new_user() from public;
