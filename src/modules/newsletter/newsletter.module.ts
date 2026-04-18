import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NewsletterSubscriber } from './entities/newsletter-subscriber.entity';
import { NewsletterService } from './services/newsletter.service';
import { NewsletterController } from './controllers/newsletter.controller';
import { NewsletterSubscriberRepository } from './repositories/newsletter-subscriber.repository';
import { MailerService } from '@infrastructure/email/mailer.service';

@Module({
  imports: [TypeOrmModule.forFeature([NewsletterSubscriber])],
  controllers: [NewsletterController],
  providers: [NewsletterService, NewsletterSubscriberRepository, MailerService],
  exports: [NewsletterService],
})
export class NewsletterModule {}
