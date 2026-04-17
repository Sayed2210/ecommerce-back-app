import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { AbstractRepository } from '@common/database/abstract.repository';
import { NewsletterSubscriber } from '../entities/newsletter-subscriber.entity';

@Injectable()
export class NewsletterSubscriberRepository extends AbstractRepository<NewsletterSubscriber> {
    constructor(
        @InjectRepository(NewsletterSubscriber)
        private readonly subscriberRepo: Repository<NewsletterSubscriber>,
    ) {
        super(subscriberRepo);
    }

    save(entity: NewsletterSubscriber): Promise<NewsletterSubscriber> {
        return this.subscriberRepo.save(entity);
    }

    find(options?: FindManyOptions<NewsletterSubscriber>): Promise<NewsletterSubscriber[]> {
        return this.subscriberRepo.find(options);
    }

    count(options?: FindManyOptions<NewsletterSubscriber>): Promise<number> {
        return this.subscriberRepo.count(options);
    }
}
