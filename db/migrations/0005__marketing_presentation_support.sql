alter table app.product_variants
  add column if not exists attributes jsonb not null default '{}'::jsonb;

alter table app.ingredients
  add column if not exists image_path text null,
  add column if not exists aliases jsonb not null default '[]'::jsonb;

alter table app.variant_ingredients
  add column if not exists label text null;

alter table app.page_sections
  drop constraint if exists page_sections_type_check;

alter table app.page_sections
  add constraint page_sections_type_check check (
    section_type in (
      'hero',
      'problem_statement',
      'featured_products',
      'ingredient_story',
      'benefit_grid',
      'science_strip',
      'process_steps',
      'delivery_reassurance',
      'lifestyle_gallery',
      'review_highlight',
      'faq',
      'final_cta'
    )
  );
