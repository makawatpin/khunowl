-- Day-of-month a bill/subscription is "really" due on. Rolling next_due forward month by month
-- from an already-clamped date drifts (31 Jan → 28 Feb → 28 Mar ...); rolling with the anchor
-- restores the 31st whenever the month allows. Null = fall back to the day of next_due/next_billing.
alter table bills add column anchor_day smallint check (anchor_day between 1 and 31);
alter table subscriptions add column anchor_day smallint check (anchor_day between 1 and 31);
update bills set anchor_day = extract(day from next_due)::smallint where anchor_day is null;
update subscriptions set anchor_day = extract(day from next_billing)::smallint where anchor_day is null;
