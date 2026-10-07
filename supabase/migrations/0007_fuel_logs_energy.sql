-- EV charging sessions share fuel_logs: `energy` says which unit `liters` / `price_per_l` carry
-- ('fuel' = litres and ฿/L, 'ev' = kWh and ฿/kWh). Existing rows are all petrol/diesel.
alter table fuel_logs add column energy text not null default 'fuel' check (energy in ('fuel', 'ev'));
