create unique index if not exists product_media_primary_product_type_idx
  on app.product_media (product_id, media_type)
  where product_id is not null and is_primary = true;

create unique index if not exists product_media_primary_variant_type_idx
  on app.product_media (variant_id, media_type)
  where variant_id is not null and is_primary = true;

drop trigger if exists audit_product_media_change on app.product_media;
create trigger audit_product_media_change
after insert or update or delete on app.product_media
for each row
execute function audit.log_row_change('id');
