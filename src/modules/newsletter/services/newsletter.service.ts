import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { SendCampaignDto, SubscribeDto } from '../dtos/subscribe.dto';
import { MailerService } from '@infrastructure/email/mailer.service';
import { BullmqService } from '@infrastructure/queue/bullmq.service';
import { NewsletterSubscriberRepository } from '../repositories/newsletter-subscriber.repository';

@Injectable()
export class NewsletterService {
  constructor(
    private readonly subscriberRepository: NewsletterSubscriberRepository,
    private readonly mailerService: MailerService,
    private readonly bullmqService: BullmqService,
  ) {}

  async subscribe(dto: SubscribeDto): Promise<{ message: string }> {
    const existing = await this.subscriberRepository.findOne({
      email: dto.email,
    });

    if (existing) {
      if (existing.isActive)
        throw new ConflictException('Email already subscribed');
      // Re-subscribe
      existing.isActive = true;
      existing.name = dto.name ?? existing.name;
      await this.subscriberRepository.save(existing);
      return { message: 'Successfully re-subscribed' };
    }

    await this.subscriberRepository.create({
      email: dto.email,
      name: dto.name,
      unsubscribeToken: crypto.randomUUID(),
    });

    await this.mailerService.sendWelcomeEmail(dto.email, {
      name: dto.name ?? dto.email,
    });

    return { message: 'Successfully subscribed' };
  }

  async unsubscribe(token: string): Promise<{ message: string }> {
    const subscriber = await this.subscriberRepository.findOne({
      unsubscribeToken: token,
    });

    if (!subscriber) throw new NotFoundException('Invalid unsubscribe token');

    subscriber.isActive = false;
    await this.subscriberRepository.save(subscriber);

    return { message: 'Successfully unsubscribed' };
  }

  async sendCampaign(dto: SendCampaignDto): Promise<{ queued: number }> {
    const subscribers = await this.subscriberRepository.find({
      where: { isActive: true },
    });

    for (const subscriber of subscribers) {
      await this.bullmqService.addEmailJob('send-newsletter', {
        to: subscriber.email,
        subject: dto.subject,
        template: 'newsletter',
        data: {
          subject: dto.subject,
          content: dto.content,
          name: subscriber.name,
        },
      });
    }

    return { queued: subscribers.length };
  }

  async getSubscriberCount(): Promise<number> {
    return this.subscriberRepository.count({ where: { isActive: true } });
  }
}
