import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { AbstractRepository } from '@common/database/abstract.repository';
import { Notification } from '../entities/notification.entity';

@Injectable()
export class NotificationRepository extends AbstractRepository<Notification> {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {
    super(notificationRepo);
  }

  save(entity: Notification): Promise<Notification> {
    return this.notificationRepo.save(entity);
  }

  findAndCount(
    options?: FindManyOptions<Notification>,
  ): Promise<[Notification[], number]> {
    return this.notificationRepo.findAndCount(options);
  }

  remove(entity: Notification): Promise<Notification> {
    return this.notificationRepo.remove(entity);
  }

  async markAllReadByUser(userId: string): Promise<void> {
    await this.notificationRepo
      .createQueryBuilder()
      .update(Notification)
      .set({ readAt: new Date() })
      .where('user_id = :userId', { userId })
      .andWhere('read_at IS NULL')
      .execute();
  }
}
