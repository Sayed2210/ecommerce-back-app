import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InvoiceService } from '../services/invoice.service';
import { MailerService } from '@infrastructure/email/mailer.service';
import { OrdersService } from '../services/orders.service';

@Processor('order-processing')
export class SendInvoiceProcessor extends WorkerHost {
  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly mailerService: MailerService,
    private readonly ordersService: OrdersService,
  ) {
    super();
  }

  async process(job: Job<{ orderId: string; userId: string }>): Promise<any> {
    if (job.name !== 'send-invoice') return;

    const { orderId } = job.data;

    const order = await this.ordersService.findOne(orderId);
    if (!order || !order.user?.email) {
      return { status: 'skipped', reason: 'No email' };
    }

    const pdfBuffer = await this.invoiceService.generateInvoiceBuffer(orderId);

    await this.mailerService.sendInvoiceEmail(
      order.user.email,
      {
        orderNumber: order.orderNumber,
        total: Number(order.totalAmount),
        items: order.items,
        shippingAddress: order.shippingAddress,
        firstName: order.user.firstName,
      },
      pdfBuffer,
    );

    return { status: 'sent', orderId };
  }
}
