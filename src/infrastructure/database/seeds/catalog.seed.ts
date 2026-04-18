import { AppDataSource } from '../../../../ormconfig';
import { Category } from '../../../modules/products/entities/category.entity';
import { Brand } from '../../../modules/products/entities/brand.entity';
import { Product } from '../../../modules/products/entities/product.entity';

async function seed() {
  try {
    await AppDataSource.initialize();

    const categoryRepo = AppDataSource.getTreeRepository(Category);
    const brandRepo = AppDataSource.getRepository(Brand);
    const productRepo = AppDataSource.getRepository(Product);

    // ── Categories (tree) ──────────────────────────────────────────────────

    const categoryDefs = [
      {
        slug: 'electronics',
        name: { en: 'Electronics', ar: 'إلكترونيات' },
        children: [
          {
            slug: 'smartphones',
            name: { en: 'Smartphones', ar: 'هواتف ذكية' },
          },
          { slug: 'laptops', name: { en: 'Laptops', ar: 'لابتوب' } },
          { slug: 'audio', name: { en: 'Audio', ar: 'صوتيات' } },
        ],
      },
      {
        slug: 'fashion',
        name: { en: 'Fashion', ar: 'موضة' },
        children: [
          {
            slug: 'mens-clothing',
            name: { en: "Men's Clothing", ar: 'ملابس رجالي' },
          },
          {
            slug: 'womens-clothing',
            name: { en: "Women's Clothing", ar: 'ملابس نسائي' },
          },
        ],
      },
      {
        slug: 'home-garden',
        name: { en: 'Home & Garden', ar: 'المنزل والحديقة' },
        children: [
          { slug: 'furniture', name: { en: 'Furniture', ar: 'أثاث' } },
          {
            slug: 'appliances',
            name: { en: 'Appliances', ar: 'أجهزة منزلية' },
          },
        ],
      },
    ];

    const categoryMap = new Map<string, Category>();

    for (const def of categoryDefs) {
      let parent = await categoryRepo.findOneBy({ slug: def.slug });
      if (!parent) {
        parent = categoryRepo.create({
          slug: def.slug,
          name: def.name,
          isActive: true,
          metadata: {},
        });
        parent = await categoryRepo.save(parent);
        console.log(`Created category: ${def.slug}`);
      }
      categoryMap.set(def.slug, parent);

      for (const child of def.children ?? []) {
        let childCat = await categoryRepo.findOneBy({ slug: child.slug });
        if (!childCat) {
          childCat = categoryRepo.create({
            slug: child.slug,
            name: child.name,
            parent,
            isActive: true,
            metadata: {},
          });
          childCat = await categoryRepo.save(childCat);
          console.log(`Created sub-category: ${child.slug}`);
        }
        categoryMap.set(child.slug, childCat);
      }
    }

    // ── Brands ─────────────────────────────────────────────────────────────

    const brandDefs = [
      { slug: 'apple', name: { en: 'Apple', ar: 'آبل' } },
      { slug: 'samsung', name: { en: 'Samsung', ar: 'سامسونج' } },
      { slug: 'sony', name: { en: 'Sony', ar: 'سوني' } },
      { slug: 'nike', name: { en: 'Nike', ar: 'نايكي' } },
      { slug: 'ikea', name: { en: 'IKEA', ar: 'إيكيا' } },
    ];

    const brandMap = new Map<string, Brand>();
    for (const def of brandDefs) {
      let brand = await brandRepo.findOneBy({ slug: def.slug });
      if (!brand) {
        brand = brandRepo.create({
          slug: def.slug,
          name: def.name,
          isActive: true,
        });
        brand = await brandRepo.save(brand);
        console.log(`Created brand: ${def.slug}`);
      }
      brandMap.set(def.slug, brand);
    }

    // ── Products ───────────────────────────────────────────────────────────

    const productDefs = [
      {
        slug: 'iphone-15-pro',
        name: { en: 'iPhone 15 Pro', ar: 'آيفون 15 برو' },
        description: {
          en: 'Latest Apple flagship smartphone',
          ar: 'أحدث هاتف آبل الرائد',
        },
        basePrice: 999,
        categorySlug: 'smartphones',
        brandSlug: 'apple',
        inventoryQuantity: 50,
        isFeatured: true,
      },
      {
        slug: 'samsung-galaxy-s24',
        name: { en: 'Samsung Galaxy S24', ar: 'سامسونج جالكسي S24' },
        description: {
          en: 'Premium Android smartphone',
          ar: 'هاتف أندرويد متميز',
        },
        basePrice: 799,
        categorySlug: 'smartphones',
        brandSlug: 'samsung',
        inventoryQuantity: 75,
        isFeatured: false,
      },
      {
        slug: 'sony-wh1000xm5',
        name: { en: 'Sony WH-1000XM5', ar: 'سوني WH-1000XM5' },
        description: {
          en: 'Industry-leading noise-cancelling headphones',
          ar: 'سماعات رأس بإلغاء الضوضاء',
        },
        basePrice: 349,
        categorySlug: 'audio',
        brandSlug: 'sony',
        inventoryQuantity: 120,
        isFeatured: true,
      },
      {
        slug: 'macbook-pro-16',
        name: { en: 'MacBook Pro 16"', ar: 'ماك بوك برو 16 بوصة' },
        description: {
          en: 'Powerful laptop for professionals',
          ar: 'لابتوب قوي للمحترفين',
        },
        basePrice: 2499,
        categorySlug: 'laptops',
        brandSlug: 'apple',
        inventoryQuantity: 30,
        isFeatured: true,
      },
      {
        slug: 'nike-air-max-270',
        name: { en: 'Nike Air Max 270', ar: 'نايكي اير ماكس 270' },
        description: {
          en: 'Lifestyle shoes with Max Air cushioning',
          ar: 'حذاء رياضي بتقنية الهواء',
        },
        basePrice: 150,
        categorySlug: 'mens-clothing',
        brandSlug: 'nike',
        inventoryQuantity: 200,
        isFeatured: false,
      },
      {
        slug: 'ikea-kallax-shelf',
        name: { en: 'KALLAX Shelf Unit', ar: 'وحدة رفوف KALLAX' },
        description: {
          en: 'Versatile shelf unit for any room',
          ar: 'وحدة رفوف متعددة الاستخدامات',
        },
        basePrice: 89,
        categorySlug: 'furniture',
        brandSlug: 'ikea',
        inventoryQuantity: 60,
        isFeatured: false,
      },
    ];

    for (const def of productDefs) {
      const existing = await productRepo.findOneBy({ slug: def.slug });
      if (existing) {
        console.log(`Product already exists: ${def.slug}`);
        continue;
      }

      const product = productRepo.create({
        slug: def.slug,
        name: def.name,
        description: def.description,
        basePrice: def.basePrice,
        category: categoryMap.get(def.categorySlug),
        brand: brandMap.get(def.brandSlug),
        inventoryQuantity: def.inventoryQuantity,
        isFeatured: def.isFeatured,
        isActive: true,
        trackInventory: true,
        metadata: {},
      });

      await productRepo.save(product);
      console.log(`Created product: ${def.slug}`);
    }

    console.log('Catalog seed complete.');
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error during catalog seeding:', error);
    process.exit(1);
  }
}

void seed();
