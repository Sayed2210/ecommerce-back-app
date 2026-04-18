import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReturnsAndNewsletterEntities1776035622526 implements MigrationInterface {
  name = 'AddReturnsAndNewsletterEntities1776035622526';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enums (idempotent)
    const statusEnumExists = await queryRunner.query(
      `SELECT 1 FROM pg_type WHERE typname = 'return_requests_status_enum'`,
    );
    if (!statusEnumExists.length) {
      await queryRunner.query(
        `CREATE TYPE "public"."return_requests_status_enum" AS ENUM('pending', 'approved', 'rejected', 'refunded')`,
      );
    }

    const reasonEnumExists = await queryRunner.query(
      `SELECT 1 FROM pg_type WHERE typname = 'return_requests_reason_enum'`,
    );
    if (!reasonEnumExists.length) {
      await queryRunner.query(
        `CREATE TYPE "public"."return_requests_reason_enum" AS ENUM('defective', 'wrong_item', 'not_as_described', 'changed_mind')`,
      );
    }

    // Create return_requests table (idempotent)
    const returnRequestsExists = await queryRunner.query(
      `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'return_requests'`,
    );
    if (!returnRequestsExists.length) {
      await queryRunner.query(`CREATE TABLE "return_requests" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "status" "public"."return_requests_status_enum" NOT NULL DEFAULT 'pending',
                "reason" "public"."return_requests_reason_enum" NOT NULL,
                "notes" text,
                "refund_amount" numeric(12,2) NOT NULL,
                "refund_id" character varying,
                "user_id" uuid,
                "order_id" uuid,
                "order_item_id" uuid,
                CONSTRAINT "PK_return_requests" PRIMARY KEY ("id")
            )`);
    }

    // Create newsletter_subscribers table (idempotent)
    const newsletterExists = await queryRunner.query(
      `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'newsletter_subscribers'`,
    );
    if (!newsletterExists.length) {
      await queryRunner.query(`CREATE TABLE "newsletter_subscribers" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "email" character varying(255) NOT NULL,
                "name" character varying(100),
                "is_active" boolean NOT NULL DEFAULT true,
                "unsubscribe_token" character varying NOT NULL,
                CONSTRAINT "UQ_newsletter_subscribers_email" UNIQUE ("email"),
                CONSTRAINT "UQ_newsletter_subscribers_unsubscribe_token" UNIQUE ("unsubscribe_token"),
                CONSTRAINT "PK_newsletter_subscribers" PRIMARY KEY ("id")
            )`);
    }

    // Add foreign keys (idempotent)
    const fkUserExists = await queryRunner.query(
      `SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_return_requests_user_id'`,
    );
    if (!fkUserExists.length) {
      await queryRunner.query(
        `ALTER TABLE "return_requests" ADD CONSTRAINT "FK_return_requests_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
      );
    }

    const fkOrderExists = await queryRunner.query(
      `SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_return_requests_order_id'`,
    );
    if (!fkOrderExists.length) {
      await queryRunner.query(
        `ALTER TABLE "return_requests" ADD CONSTRAINT "FK_return_requests_order_id" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
      );
    }

    const fkOrderItemExists = await queryRunner.query(
      `SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_return_requests_order_item_id'`,
    );
    if (!fkOrderItemExists.length) {
      await queryRunner.query(
        `ALTER TABLE "return_requests" ADD CONSTRAINT "FK_return_requests_order_item_id" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.query(
      `ALTER TABLE "return_requests" DROP CONSTRAINT IF EXISTS "FK_return_requests_order_item_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "return_requests" DROP CONSTRAINT IF EXISTS "FK_return_requests_order_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "return_requests" DROP CONSTRAINT IF EXISTS "FK_return_requests_user_id"`,
    );

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "newsletter_subscribers"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "return_requests"`);

    // Drop enums
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."return_requests_reason_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."return_requests_status_enum"`,
    );
  }
}
