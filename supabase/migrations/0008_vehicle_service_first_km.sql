-- Optional first service milestone (e.g. 5,000 km) before the regular service_every_km cycle
-- (e.g. every 10,000 km -> 5k, 15k, 25k ...). Null = plain multiples of service_every_km.
alter table vehicles add column service_first_km int check (service_first_km > 0);
