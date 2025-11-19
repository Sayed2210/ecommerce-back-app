import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [ThrottlerModule.forRoot({
    throttlers: [
      {
        ttl: 60000,
        limit: 10,
      },
    ],
  }), BullModule.forRoot({
    connection: {
      host: 'localhost',
      port: 6379,
    },
  }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
