import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../entities/order.entity';

import * as PdfPrinterModule from 'pdfmake';
const PdfPrinter = PdfPrinterModule as any;

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);
  private readonly fonts = {
    Roboto: {
      normal: 'Helvetica',
      bold: 'Helvetica-Bold',
      italics: 'Helvetica-Oblique',
      bolditalics: 'Helvetica-BoldOblique',
    },
  };

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async generateInvoiceBuffer(orderId: string): Promise<Buffer> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['user', 'items', 'shippingAddress', 'billingAddress'],
    });

    if (!order) {
      throw new Error('Order not found');
    }

    const printer = new PdfPrinter(this.fonts);

    const itemsBody: any[] = [
      [
        { text: 'Product', style: 'tableHeader' },
        { text: 'SKU', style: 'tableHeader' },
        { text: 'Qty', style: 'tableHeader', alignment: 'center' },
        { text: 'Unit Price', style: 'tableHeader', alignment: 'right' },
        { text: 'Total', style: 'tableHeader', alignment: 'right' },
      ],
    ];

    for (const item of order.items || []) {
      itemsBody.push([
        item.productName + (item.variantName ? `\n${item.variantName}` : ''),
        item.sku || '-',
        { text: String(item.quantity), alignment: 'center' },
        { text: `$${Number(item.unitPrice).toFixed(2)}`, alignment: 'right' },
        { text: `$${Number(item.totalPrice).toFixed(2)}`, alignment: 'right' },
      ]);
    }

    const addressLines = (addr: any) => {
      if (!addr) return '-';
      return [
        addr.streetAddress || '',
        `${addr.city || ''}${addr.state ? ', ' + addr.state : ''} ${addr.postalCode || ''}`,
        addr.country || '',
      ]
        .filter(Boolean)
        .join('\n');
    };

    const docDefinition: any = {
      content: [
        { text: 'INVOICE', style: 'title' },
        {
          columns: [
            {
              width: '*',
              text: [
                { text: `Order: #${order.orderNumber}\n`, bold: true },
                `Date: ${order.createdAt.toISOString().split('T')[0]}\n`,
                `Currency: ${order.currency}`,
              ],
            },
            {
              width: '*',
              text: [
                { text: 'Bill To:\n', bold: true },
                `${order.user?.firstName || ''} ${order.user?.lastName || ''}\n`,
                order.user?.email || '',
              ],
            },
          ],
          columnGap: 20,
          margin: [0, 0, 0, 20],
        },
        {
          columns: [
            {
              width: '*',
              text: [
                { text: 'Shipping Address:\n', bold: true },
                addressLines(order.shippingAddress),
              ],
            },
            {
              width: '*',
              text: [
                { text: 'Billing Address:\n', bold: true },
                addressLines(order.billingAddress),
              ],
            },
          ],
          columnGap: 20,
          margin: [0, 0, 0, 20],
        },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto', 'auto'],
            body: itemsBody,
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 20],
        },
        {
          alignment: 'right',
          table: {
            widths: ['*', 'auto'],
            body: [
              ['Subtotal', `$${Number(order.subtotal).toFixed(2)}`],
              ['Discount', `$${Number(order.discountAmount).toFixed(2)}`],
              ['Shipping', `$${Number(order.shippingAmount).toFixed(2)}`],
              ['Tax', `$${Number(order.taxAmount).toFixed(2)}`],
              [
                { text: 'Total', bold: true },
                {
                  text: `$${Number(order.totalAmount).toFixed(2)}`,
                  bold: true,
                },
              ],
            ],
          },
          layout: {
            defaultBorder: false,
            hLineWidth: () => 0,
            vLineWidth: () => 0,
            paddingLeft: () => 8,
            paddingRight: () => 8,
            paddingTop: () => 4,
            paddingBottom: () => 4,
          },
        },
      ],
      styles: {
        title: {
          fontSize: 22,
          bold: true,
          margin: [0, 0, 0, 20],
        },
        tableHeader: {
          bold: true,
          fontSize: 12,
          color: 'black',
        },
      },
      defaultStyle: {
        fontSize: 10,
      },
    };

    return new Promise((resolve, reject) => {
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      const chunks: Buffer[] = [];
      pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', reject);
      pdfDoc.end();
    });
  }
}
