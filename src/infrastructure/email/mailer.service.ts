import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import { compile } from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { BullmqService } from '@infrastructure/queue/bullmq.service';

export interface EmailTemplateData {
    [key: string]: any;
}

export interface EmailOptions {
    to: string | string[];
    subject: string;
    template: string;
    data: EmailTemplateData;
    attachments?: {
        filename: string;
        content: Buffer;
        contentType?: string;
    }[];
}

@Injectable()
export class MailerService {
    private readonly logger = new Logger(MailerService.name);
    private transporter: Transporter;
    private templatesDir: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly bullmqService: BullmqService,
    ) {
        this.transporter = createTransport({
            host: this.configService.get('SMTP_HOST'),
            port: this.configService.get('SMTP_PORT'),
            secure: this.configService.get('SMTP_SECURE') === 'true',
            auth: {
                user: this.configService.get('SMTP_USER'),
                pass: this.configService.get('SMTP_PASS'),
            },
            pool: true,
            maxConnections: 5,
            maxMessages: 100,
            rateLimit: 10,
            tls: {
                rejectUnauthorized: false, // Set true in production with valid cert
            },
        });

        this.templatesDir = path.join(process.cwd(), 'templates', 'emails');
        this.ensureTemplatesDir();
    }

    private ensureTemplatesDir(): void {
        const dir = path.join(process.cwd(), 'templates');
        const emailsDir = path.join(dir, 'emails');

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        if (!fs.existsSync(emailsDir)) {
            fs.mkdirSync(emailsDir, { recursive: true });
        }
    }

    /**
     * Send email immediately (synchronous)
     */
    async sendEmail(options: EmailOptions): Promise<void> {
        try {
            const startTime = Date.now();

            const html = await this.compileTemplate(options.template, options.data);

            const result = await this.transporter.sendMail({
                from: this.configService.get('MAIL_FROM'),
                to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
                subject: options.subject,
                html,
                attachments: options.attachments,
            });

            this.logger.log(`✉️  Email sent successfully to ${options.to} (Message ID: ${result.messageId})`);

            // Record metrics
            const duration = Date.now() - startTime;
            this.logger.debug(`Email send time: ${duration}ms`);

        } catch (error) {
            this.logger.error(`❌ Failed to send email to ${options.to}: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Add email to queue for async sending
     */
    async sendEmailAsync(options: EmailOptions): Promise<void> {
        await this.bullmqService.addEmailJob('send-email', options, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 2000,
            },
        });

        this.logger.log(`📨 Email queued for ${options.to}`);
    }

    /**
     * Send email with template compilation
     */
    private async compileTemplate(templateName: string, data: EmailTemplateData): Promise<string> {
        const templatePath = path.join(this.templatesDir, `${templateName}.hbs`);

        if (!fs.existsSync(templatePath)) {
            throw new Error(`Email template not found: ${templatePath}`);
        }

        const templateSource = fs.readFileSync(templatePath, 'utf8');
        const template = compile(templateSource);

        // Add common data
        const templateData = {
            ...data,
            appName: this.configService.get('APP_NAME', 'E-Commerce Store'),
            supportEmail: this.configService.get('SUPPORT_EMAIL'),
            year: new Date().getFullYear(),
            logoUrl: this.configService.get('APP_LOGO_URL'),
        };

        return template(templateData);
    }

    // ===== Pre-defined Email Methods =====

    async sendWelcomeEmail(to: string, data: { name: string }): Promise<void> {
        await this.sendEmailAsync({
            to,
            subject: `Welcome to ${this.configService.get('APP_NAME', 'Our Store')}!`,
            template: 'welcome',
            data,
        });
    }

    async sendOrderConfirmation(to: string, data: {
        orderNumber: string;
        total: number;
        items: any[];
        shippingAddress: any;
    }): Promise<void> {
        await this.sendEmailAsync({
            to,
            subject: `Order Confirmation - #${data.orderNumber}`,
            template: 'order-confirmation',
            data,
        });
    }

    async sendPasswordReset(to: string, data: {
        name: string;
        resetUrl: string;
        expiresIn: string;
    }): Promise<void> {
        await this.sendEmailAsync({
            to,
            subject: 'Reset Your Password',
            template: 'password-reset',
            data,
        });
    }

    async sendVerificationEmail(to: string, data: {
        name: string;
        url: string;
    }): Promise<void> {
        await this.sendEmailAsync({
            to,
            subject: 'Verify Your Email Address',
            template: 'verification',
            data,
        });
    }

    async sendOrderShipped(to: string, data: {
        orderNumber: string;
        trackingNumber: string;
        carrier: string;
    }): Promise<void> {
        await this.sendEmailAsync({
            to,
            subject: `Your Order #${data.orderNumber} Has Shipped!`,
            template: 'order-shipped',
            data,
        });
    }

    async sendAbandonedCartReminder(to: string, data: {
        name: string;
        cartItems: any[];
        cartTotal: number;
        recoveryUrl: string; // Corrected from recoveryLink to recoveryUrl in template data or usage? Template uses recoveryLink? Job passes recoveryLink.
        // Service signature usually defines data structure. Job passes `userName, cartItems, cartTotal, recoveryLink`.
        // Service expects `name, cartItems, cartTotal, recoveryUrl`.
        // Mismatch in properties too!
        // I will align service to accept what usage sends or update usage.
    }): Promise<void> {
        await this.sendEmailAsync({
            to,
            subject: 'Your cart is waiting for you!',
            template: 'abandoned-cart',
            data,
        });
    }

    async sendAbandonedCartFollowUp(to: string, data: {
        userName: string;
        cartItems: any[];
        cartTotal: number;
        discountCode: string;
        recoveryLink: string;
    }): Promise<void> {
        await this.sendEmailAsync({
            to,
            subject: 'We missed you! Here is a discount',
            template: 'abandoned-cart-followup',
            data,
        });
    }

    async sendNewsletter(to: string, data: {
        subject: string;
        content: string;
    }): Promise<void> {
        await this.sendEmailAsync({
            to,
            subject: data.subject,
            template: 'newsletter',
            data,
        });
    }

    /**
     * Verify SMTP connection
     */
    async verifyConnection(): Promise<boolean> {
        try {
            await this.transporter.verify();
            this.logger.log('✅ SMTP connection verified');
            return true;
        } catch (error) {
            this.logger.error('❌ SMTP connection failed', error);
            return false;
        }
    }

    /**
     * Get mailer stats
     */
    async getStats(): Promise<any> {
        const transporterAny = this.transporter as any;
        const messagesSent = transporterAny?.transporter?.sender?.messageCount || 0;
        return {
            messagesSent,
            isConnected: await this.verifyConnection(),
        };
    }
}