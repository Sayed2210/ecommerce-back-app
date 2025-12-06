import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';

export interface JobData {
    [key: string]: any;
}

export interface JobOptions {
    priority?: number;
    delay?: number;
    attempts?: number;
    backoff?: {
        type: 'fixed' | 'exponential';
        delay: number;
    };
    removeOnComplete?: boolean | number;
    removeOnFail?: boolean | number;
}

@Injectable()
export class BullmqService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(BullmqService.name);
    private redisConnection: Redis;
    private queues: Map<string, Queue> = new Map();
    private workers: Map<string, Worker> = new Map();
    private schedulers: Map<string, any> = new Map();

    constructor(private readonly configService: ConfigService) {
        this.redisConnection = new Redis({
            host: this.configService.get('REDIS_HOST', 'localhost'),
            port: this.configService.get('REDIS_PORT', 6379),
            password: this.configService.get('REDIS_PASSWORD'),
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            lazyConnect: true,
        });

        this.redisConnection.on('error', (err) => {
            this.logger.error('❌ Redis connection error:', err.message);
        });

        this.redisConnection.on('connect', () => {
            this.logger.log('✅ Connected to Redis for BullMQ');
        });
    }

    async onModuleInit(): Promise<void> {
        this.logger.log('🚀 BullMQ Service initialized');
    }

    async onModuleDestroy(): Promise<void> {
        this.logger.log('🛑 Shutting down BullMQ Service...');

        // Close all workers
        for (const [name, worker] of this.workers) {
            await worker.close();
            this.logger.log(`👷 Worker ${name} closed`);
        }

        // Close all queues
        for (const [name, queue] of this.queues) {
            await queue.close();
            this.logger.log(`📋 Queue ${name} closed`);
        }

        // Close all schedulers
        for (const [name, scheduler] of this.schedulers) {
            await scheduler.close();
            this.logger.log(`📅 Scheduler ${name} closed`);
        }

        // Close Redis connection
        await this.redisConnection.quit();
    }

    /**
     * Get or create a queue
     */
    private getOrCreateQueue(queueName: string): Queue {
        if (!this.queues.has(queueName)) {
            const queue = new Queue(queueName, {
                connection: this.redisConnection,
                defaultJobOptions: {
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 2000,
                    },
                    removeOnComplete: { count: 1000 },
                    removeOnFail: { count: 5000 },
                },
            });

            queue.on('error', (err) => {
                this.logger.error(`❌ Queue ${queueName} error:`, err.message);
            });

            this.queues.set(queueName, queue);
            this.logger.log(`📋 Queue initialized: ${queueName}`);
        }

        return this.queues.get(queueName)!;
    }

    /**
     * Add job to queue
     */
    async addJob<T extends JobData>(
        queueName: string,
        name: string,
        data: T,
        options: JobOptions = {},
    ): Promise<Job<T>> {
        const queue = this.getOrCreateQueue(queueName);

        const job = await queue.add(name, data, {
            ...options,
        });

        this.logger.log(`➕ Job added: ${job.id} to queue ${queueName}`);
        return job;
    }

    /**
     * Create worker for queue
     */
    createWorker<T extends JobData>(
        queueName: string,
        processor: (job: Job<T>) => Promise<any>,
        concurrency = 1,
    ): Worker {
        if (this.workers.has(queueName)) {
            return this.workers.get(queueName)!;
        }

        const worker = new Worker<T>(
            queueName,
            async (job) => {
                this.logger.log(`👷 Processing job ${job.id} in queue ${queueName}`);

                try {
                    const result = await processor(job);
                    this.logger.log(`✅ Job completed: ${job.id}`);
                    return result;
                } catch (error) {
                    this.logger.error(`❌ Job failed: ${job.id}`, error);
                    throw error;
                }
            },
            {
                connection: this.redisConnection,
                concurrency,
            },
        );

        worker.on('completed', (job) => {
            this.logger.log(`🎉 Job ${job.id} completed successfully`);
        });

        worker.on('failed', (job, err) => {
            this.logger.error(`💥 Job ${job?.id} failed after ${job?.attemptsMade} attempts:`, err.message);
        });

        worker.on('error', (err) => {
            this.logger.error(`❌ Worker error in ${queueName}:`, err.message);
        });

        this.workers.set(queueName, worker);
        this.logger.log(`👷 Worker created for queue: ${queueName}`);
        return worker;
    }

    /**
     * Get job by ID
     */
    async getJob<T extends JobData>(queueName: string, jobId: string): Promise<Job<T> | undefined> {
        const queue = this.getOrCreateQueue(queueName);
        return queue.getJob(jobId);
    }

    /**
     * Get job counts for queue
     */
    async getJobCounts(queueName: string): Promise<any> {
        const queue = this.getOrCreateQueue(queueName);
        return queue.getJobCounts();
    }

    /**
     * Clean queue
     */
    async cleanQueue(queueName: string, gracePeriodMs: number): Promise<void> {
        const queue = this.getOrCreateQueue(queueName);
        await queue.clean(gracePeriodMs, 0, 'completed');
        await queue.clean(gracePeriodMs, 0, 'failed');
        this.logger.log(`🧹 Queue ${queueName} cleaned`);
    }

    // ===== Pre-defined Queue Methods =====

    /**
     * Email queue
     */
    async addEmailJob<T extends JobData>(name: string, data: T, options?: JobOptions): Promise<Job<T>> {
        return this.addJob('emails', name, data, options);
    }

    async createEmailWorker(processor: (job: Job) => Promise<any>): Promise<Worker> {
        return this.createWorker('emails', processor, 2);
    }

    /**
     * Image processing queue
     */
    async addImageProcessingJob<T extends JobData>(name: string, data: T, options?: JobOptions): Promise<Job<T>> {
        return this.addJob('image-processing', name, data, {
            ...options,
            attempts: 3,
            backoff: { type: 'exponential', delay: 3000 },
        });
    }

    async createImageProcessingWorker(processor: (job: Job) => Promise<any>): Promise<Worker> {
        return this.createWorker('image-processing', processor, 1);
    }

    /**
     * Order processing queue
     */
    async addOrderProcessingJob<T extends JobData>(name: string, data: T, options?: JobOptions): Promise<Job<T>> {
        return this.addJob('order-processing', name, data, {
            ...options,
            priority: 1, // High priority
        });
    }

    async createOrderProcessingWorker(processor: (job: Job) => Promise<any>): Promise<Worker> {
        return this.createWorker('order-processing', processor, 3);
    }

    /**
     * Notification queue
     */
    async addNotificationJob<T extends JobData>(name: string, data: T, options?: JobOptions): Promise<Job<T>> {
        return this.addJob('notifications', name, data, {
            ...options,
            removeOnComplete: true,
        });
    }

    async createNotificationWorker(processor: (job: Job) => Promise<any>): Promise<Worker> {
        return this.createWorker('notifications', processor, 5);
    }

    /**
     * Analytics queue (low priority)
     */
    async addAnalyticsJob<T extends JobData>(name: string, data: T, options?: JobOptions): Promise<Job<T>> {
        return this.addJob('analytics', name, data, {
            ...options,
            priority: 5, // Low priority
            delay: 5000, // Delay processing
        });
    }

    async createAnalyticsWorker(processor: (job: Job) => Promise<any>): Promise<Worker> {
        return this.createWorker('analytics', processor, 2);
    }

    /**
     * Get queue metrics for monitoring
     */
    async getMetrics(): Promise<any> {
        const metrics = [];

        for (const [queueName, queue] of this.queues) {
            const counts = await this.getJobCounts(queueName);
            metrics.push({
                queueName,
                ...counts,
            });
        }

        return metrics;
    }

    /**
     * Pause queue processing
     */
    async pauseQueue(queueName: string): Promise<void> {
        const queue = this.getOrCreateQueue(queueName);
        await queue.pause();
        this.logger.log(`⏸️  Queue paused: ${queueName}`);
    }

    /**
     * Resume queue processing
     */
    async resumeQueue(queueName: string): Promise<void> {
        const queue = this.getOrCreateQueue(queueName);
        await queue.resume();
        this.logger.log(`▶️  Queue resumed: ${queueName}`);
    }
}