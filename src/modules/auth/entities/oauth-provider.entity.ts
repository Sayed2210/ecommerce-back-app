
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { User } from './user.entity';

export enum OAuthProviderType {
  GOOGLE = 'google',
  GITHUB = 'github',
}

@Entity('oauth_providers')
export class OAuthProvider extends BaseEntity {
  @Column({ type: 'enum', enum: OAuthProviderType })
  provider: OAuthProviderType;

  @Column({ name: 'provider_user_id' })
  providerUserId: string;

  @Column({ name: 'access_token', nullable: true })
  accessToken?: string;

  @Column({ name: 'refresh_token', nullable: true })
  refreshToken?: string;

  @ManyToOne(() => User, user => user.oauthProviders, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}