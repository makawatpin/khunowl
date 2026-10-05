-- Removing a trip member used to cascade-delete their trip_expense_shares rows silently, leaving
-- expenses whose shares no longer sum to the amount. NO ACTION (checked at end of statement)
-- still lets a whole-trip delete cascade through expenses → shares, but blocks removing a
-- member who still has shares.
alter table trip_expense_shares drop constraint trip_expense_shares_member_id_fkey;
alter table trip_expense_shares add constraint trip_expense_shares_member_id_fkey
  foreign key (member_id) references trip_members(id) on delete no action;
