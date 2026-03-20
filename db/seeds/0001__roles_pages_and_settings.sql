insert into app.roles (slug, name, description)
values
  ('admin', 'Admin', 'Full platform administration access.'),
  ('operator', 'Operator', 'Order and payment operations access.'),
  ('dispatcher', 'Dispatcher', 'Delivery assignment and tracking access.'),
  ('catalog_manager', 'Catalog Manager', 'Catalog and layout management access.')
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description;

insert into app.pages (key, name, description)
values
  ('home', 'Home', 'Public marketing and shopping landing page.'),
  ('checkout', 'Checkout', 'Checkout instructions and bank transfer surfaces.'),
  ('tracking', 'Tracking', 'Customer tracking and rider visibility surfaces.')
on conflict (key) do update
set
  name = excluded.name,
  description = excluded.description;

insert into app.site_settings (key, value)
values
  ('bank_transfer_details', '{"bankName":"","accountName":"","accountNumber":""}'::jsonb),
  ('delivery_defaults', '{"trackingEnabled":true,"staleTransferWindowMinutes":45}'::jsonb),
  ('layout_preview', '{"mode":"simulated"}'::jsonb)
on conflict (key) do update
set value = excluded.value;
