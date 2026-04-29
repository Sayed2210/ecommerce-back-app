import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { ReturnRequest, ReturnStatus } from '../entities/return-request.entity';
import { CreateReturnDto } from '../dtos/create-return.dto';
import { ProcessReturnDto } from '../dtos/process-return.dto';
import {
  Order,
  OrderStatus,
  PaymentStatus,
} from '@modules/orders/entities/order.entity';
import { OrderItem } from '@modules/orders/entities/order-item.entity';
import { PaginationDto } from '@common/dtos/pagination.dto';
import { PaginatedResponseDto } from '@common/dtos/paginated-response.dto';
import { ReturnRequestRepository } from '../repositories/return-request.repository';
import { MailerService } from '@infrastructure/email/mailer.service';

const RETURN_WINDOW_DAYS = 30;

@Injectable()
export class ReturnsService {
  private readonly stripe: Stripe;

  constructor(
    private readonly returnRepository: ReturnRequestRepository,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
  ) {
    this.stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2023-10-16' as any,
    });
  }

  async create(userId: string, dto: CreateReturnDto): Promise<ReturnRequest> {
    const order = await this.orderRepository.findOne({
      where: { id: dto.orderId },
      relations: ['user'],
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.user?.id !== userId)
      throw new ForbiddenException('Access denied');
    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException('Only delivered orders can be returned');
    }

    const daysSinceDelivery =
      (Date.now() - new Date(order.updatedAt).getTime()) /
      (1000 * 60 * 60 * 24);
    if (daysSinceDelivery > RETURN_WINDOW_DAYS) {
      throw new BadRequestException(
        `Return window of ${RETURN_WINDOW_DAYS} days has expired`,
      );
    }

    const orderItem = await this.orderItemRepository.findOne({
      where: { id: dto.orderItemId, order: { id: dto.orderId } },
    });
    if (!orderItem) throw new NotFoundException('Order item not found');

    const existing = await this.returnRepository.findOne({
      order: { id: dto.orderId },
      orderItem: { id: dto.orderItemId },
    });
    if (existing)
      throw new BadRequestException(
        'Return request already submitted for this item',
      );

    return this.returnRepository.create({
      reason: dto.reason,
      notes: dto.notes,
      refundAmount: Number(orderItem.unitPrice) * orderItem.quantity,
      user: { id: userId },
      order: { id: dto.orderId },
      orderItem: { id: dto.orderItemId },
    });
  }

  async findAllForUser(userId: string, pagination: PaginationDto) {
    const { page = 1, limit = 10 } = pagination;
    const [items, total] = await this.returnRepository.findAndCount({
      where: { user: { id: userId } },
      relations: ['order', 'orderItem'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return new PaginatedResponseDto(items, page, limit, total);
  }

  async findAll(pagination: PaginationDto, status?: string) {
    const { page = 1, limit = 10 } = pagination;
    const where: any = {};
    if (status) {
      where.status = status;
    }
    const [items, total] = await this.returnRepository.findAndCount({
      where,
      relations: ['order', 'orderItem', 'user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return new PaginatedResponseDto(items, page, limit, total);
  }

  async findOne(id: string, userId?: string): Promise<ReturnRequest> {
    const returnRequest = await this.returnRepository.findOneWithOptions({
      where: { id },
      relations: ['order', 'orderItem', 'user'],
    });
    if (!returnRequest) throw new NotFoundException('Return request not found');
    if (userId && returnRequest.user?.id !== userId)
      throw new ForbiddenException('Access denied');
    return returnRequest;
  }

  async process(id: string, dto: ProcessReturnDto): Promise<ReturnRequest> {
    const returnRequest = await this.findOne(id);

    if (returnRequest.status !== ReturnStatus.PENDING) {
      throw new BadRequestException(
        'Return request has already been processed',
      );
    }

    if (dto.status === ReturnStatus.APPROVED) {
      const order = await this.orderRepository.findOne({
        where: { id: returnRequest.order.id },
      });

      if (order?.paymentIntentId) {
        const refund = await this.stripe.refunds.create({
          payment_intent: order.paymentIntentId,
          amount: Math.round(returnRequest.refundAmount * 100),
        });
        returnRequest.refundId = refund.id;
        returnRequest.status = ReturnStatus.REFUNDED;

        await this.orderRepository.update(order.id, {
          status: OrderStatus.REFUNDED,
          paymentStatus: PaymentStatus.REFUNDED,
        });
      } else {
        returnRequest.status = ReturnStatus.APPROVED;
      }
    } else {
      returnRequest.status = ReturnStatus.REJECTED;
    }

    const saved = await this.returnRepository.save(returnRequest);

    // Notify customer of decision via email
    const userEmail = returnRequest.user?.email;
    if (userEmail) {
      const isApproved =
        saved.status === ReturnStatus.APPROVED ||
        saved.status === ReturnStatus.REFUNDED;
      this.mailerService
        .sendReturnStatusUpdate(userEmail, {
          orderNumber:
            returnRequest.order.orderNumber ?? returnRequest.order.id,
          status: saved.status,
          isApproved,
          refundAmount: isApproved ? saved.refundAmount : undefined,
        })
        .catch(() => {
          /* non-critical — log happens inside mailer */
        });
    }

    return saved;
  }
}
