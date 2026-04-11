import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMultiLanguageSupport1765641477430 implements MigrationInterface {
    name = 'AddMultiLanguageSupport1765641477430'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Categories
        await queryRunner.query(`ALTER TABLE "categories" ALTER COLUMN "name" TYPE jsonb USING jsonb_build_object('en', "name")`);
        await queryRunner.query(`ALTER TABLE "categories" ALTER COLUMN "description" TYPE jsonb USING CASE WHEN "description" IS NULL THEN NULL ELSE jsonb_build_object('en', "description") END`);

        // Brands
        await queryRunner.query(`ALTER TABLE "brands" DROP CONSTRAINT "UQ_96db6bbbaa6f23cad26871339b6"`); // Drop unique constraint on name first
        await queryRunner.query(`ALTER TABLE "brands" ALTER COLUMN "name" TYPE jsonb USING jsonb_build_object('en', "name")`);
        await queryRunner.query(`ALTER TABLE "brands" ADD CONSTRAINT "UQ_96db6bbbaa6f23cad26871339b6" UNIQUE ("name")`);
        await queryRunner.query(`ALTER TABLE "brands" ALTER COLUMN "description" TYPE jsonb USING CASE WHEN "description" IS NULL THEN NULL ELSE jsonb_build_object('en', "description") END`);

        // Product Variants
        await queryRunner.query(`ALTER TABLE "product_variants" ALTER COLUMN "variant_name" TYPE jsonb USING jsonb_build_object('en', "variant_name")`);

        // Products
        await queryRunner.query(`DROP INDEX "public"."IDX_4c9fb58de893725258746385e1"`); // Drop index on name
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "name" TYPE jsonb USING jsonb_build_object('en', "name")`);
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "description" TYPE jsonb USING CASE WHEN "description" IS NULL THEN NULL ELSE jsonb_build_object('en', "description") END`);
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "short_description" TYPE jsonb USING CASE WHEN "short_description" IS NULL THEN NULL ELSE jsonb_build_object('en', "short_description") END`);
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "seo_title" TYPE jsonb USING CASE WHEN "seo_title" IS NULL THEN NULL ELSE jsonb_build_object('en', "seo_title") END`);
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "seo_description" TYPE jsonb USING CASE WHEN "seo_description" IS NULL THEN NULL ELSE jsonb_build_object('en', "seo_description") END`);
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "seo_keywords" TYPE jsonb USING CASE WHEN "seo_keywords" IS NULL THEN NULL ELSE jsonb_build_object('en', "seo_keywords") END`);
        await queryRunner.query(`CREATE INDEX "IDX_4c9fb58de893725258746385e1" ON "products" ("name") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Products
        await queryRunner.query(`DROP INDEX "public"."IDX_4c9fb58de893725258746385e1"`);
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "seo_keywords" TYPE text USING "seo_keywords"->>'en'`);
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "seo_description" TYPE text USING "seo_description"->>'en'`);
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "seo_title" TYPE character varying(500) USING "seo_title"->>'en'`);
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "short_description" TYPE character varying USING "short_description"->>'en'`);
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "description" TYPE text USING "description"->>'en'`);
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "name" TYPE character varying(500) USING "name"->>'en'`);
        await queryRunner.query(`CREATE INDEX "IDX_4c9fb58de893725258746385e1" ON "products" ("name") `);

        // Product Variants
        await queryRunner.query(`ALTER TABLE "product_variants" ALTER COLUMN "variant_name" TYPE character varying USING "variant_name"->>'en'`);

        // Brands
        await queryRunner.query(`ALTER TABLE "brands" ALTER COLUMN "description" TYPE character varying USING "description"->>'en'`);
        await queryRunner.query(`ALTER TABLE "brands" DROP CONSTRAINT "UQ_96db6bbbaa6f23cad26871339b6"`);
        await queryRunner.query(`ALTER TABLE "brands" ALTER COLUMN "name" TYPE character varying USING "name"->>'en'`);
        await queryRunner.query(`ALTER TABLE "brands" ADD CONSTRAINT "UQ_96db6bbbaa6f23cad26871339b6" UNIQUE ("name")`);

        // Categories
        await queryRunner.query(`ALTER TABLE "categories" ALTER COLUMN "description" TYPE character varying USING "description"->>'en'`);
        await queryRunner.query(`ALTER TABLE "categories" ALTER COLUMN "name" TYPE character varying USING "name"->>'en'`);
    }

}
