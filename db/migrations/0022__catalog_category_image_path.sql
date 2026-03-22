alter table app.product_categories
  add column if not exists image_path text null;
