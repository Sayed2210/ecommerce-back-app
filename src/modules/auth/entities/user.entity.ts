// src/modules/auth/entities/user.entity.ts
import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { Address } from '@modules/users/entities/address.entity';
import { RefreshToken } from './refresh-token.entity';
import { OAuthProvider } from './oauth-provider.entity';
import { Order } from '@modules/orders/entities/order.entity';
import { Review } from '@modules/reviews/entities/review.entity';
import { Wishlist } from '@modules/users/entities/wishlist.entity';
import { Cart } from '@modules/cart/entities/cart.entity';
import { Notification } from '@modules/notifications/entities/notification.entity';
import { AuditLog } from '@modules/admin/entities/audit-log.entity';

export enum UserRole {
    CUSTOMER = 'customer',
    STAFF = 'staff',
    ADMIN = 'admin',
}

@Entity('users')
export class User extends BaseEntity {
    @Column({ unique: true, length: 255 })
    @Index()
    email: string;

    @Column({ name: 'password_hash' })
    passwordHash: string;

    @Column({ name: 'first_name', length: 100 })
    firstName: string;

    @Column({ name: 'last_name', length: 100 })
    lastName: string;

    @Column({ nullable: true, length: 20 })
    phone?: string;

    @Column({ name: 'avatar_url', nullable: true })
    avatarUrl?: string;

    @Column({ name: 'is_email_verified', default: false })
    isEmailVerified: boolean;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @Column({ type: 'enum', enum: UserRole, default: UserRole.CUSTOMER })
    role: UserRole;

    @Column({ name: 'last_login', nullable: true })
    lastLogin?: Date;

    @Column({ type: 'jsonb', default: {} })
    metadata: Record<string, any>;

    // Relationships
    @OneToMany(() => Address, address => address.user)
    addresses: Address[];

    @OneToMany(() => RefreshToken, token => token.user)
    refreshTokens: RefreshToken[];

    @OneToMany(() => OAuthProvider, provider => provider.user)
    oauthProviders: OAuthProvider[];

    @OneToMany(() => Order, order => order.user)
    orders: Order[];

    @OneToMany(() => Review, review => review.user)
    reviews: Review[];

    @OneToMany(() => Wishlist, wishlist => wishlist.user)
    wishlist: Wishlist[];

    @OneToMany(() => Cart, cart => cart.user)
    cart: Cart[];

    @OneToMany(() => Notification, notification => notification.user)
    notifications: Notification[];

    @OneToMany(() => AuditLog, log => log.user)
    auditLogs: AuditLog[];
}