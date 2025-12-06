import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BullmqService } from './bullmq.service';

@Global()
@Module({
    imports: [
        BullModule.forRoot({
            connection: {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT) || 6379,
            },
        }),
    ],
    providers: [BullmqService],
    exports: [BullmqService, BullModule],
})
export class QueueModule { }
