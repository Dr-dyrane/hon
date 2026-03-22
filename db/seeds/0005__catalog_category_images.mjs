const categoryImageBySlug = new Map([
  ["powders", "/images/products/protein_chocolate.png"],
  ["shots", "/images/products/shot_glow.png"],
]);

export async function run(client) {
  await client.query(`
    alter table app.product_categories
      add column if not exists image_path text null
  `);

  for (const [slug, imagePath] of categoryImageBySlug.entries()) {
    await client.query(
      `
        update app.product_categories
        set image_path = $2
        where slug = $1
      `,
      [slug, imagePath]
    );
  }

  await client.query(`
    update app.product_categories pc
    set image_path = media.storage_key
    from lateral (
      select pm.storage_key
      from app.products p
      left join app.product_media pm
        on pm.product_id = p.id
       and pm.media_type = 'image'
      where p.category_id = pc.id
      order by p.sort_order asc, pm.is_primary desc, pm.sort_order asc, pm.created_at asc
      limit 1
    ) media
    where pc.image_path is null
      and media.storage_key is not null
  `);
}
