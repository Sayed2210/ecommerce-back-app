// src/modules/users/entities/address.entity.ts
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { User } from '@modules/auth/entities/user.entity';

export enum AddressLabel {
    HOME = 'home',
    WORK = 'work',
    OTHER = 'other',
}

@Entity('addresses')
export class Address extends BaseEntity {
    @Column({ type: 'enum', enum: AddressLabel })
    label: AddressLabel;

    @Column({ name: 'street_address' })
    streetAddress: string;

    @Column()
    city: string;

    @Column({ nullable: true })
    state?: string;

    @Column()
    country: string;

    @Column({ name: 'postal_code' })
    postalCode: string;

    @Column({ name: 'is_default', default: false })
    isDefault: boolean;

    @ManyToOne(() => User, user => user.addresses, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;
}
