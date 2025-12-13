import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsGateway } from '../services/websocket.gateway';
import { JwtService } from '@nestjs/jwt';

const mockJwtService = () => ({
    verify: jest.fn(),
});

describe('NotificationsGateway', () => {
    let gateway: NotificationsGateway;
    let jwtService: any;
    let mockServer: any;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                NotificationsGateway,
                { provide: JwtService, useFactory: mockJwtService },
            ],
        }).compile();

        gateway = module.get<NotificationsGateway>(NotificationsGateway);
        jwtService = module.get<JwtService>(JwtService);

        mockServer = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn(),
        };
        gateway.server = mockServer;
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    describe('handleConnection', () => {
        it('should join user room on valid token', () => {
            const client: any = {
                handshake: { headers: { authorization: 'Bearer token' } },
                join: jest.fn(),
            };
            jwtService.verify.mockReturnValue({ sub: 'user1' });

            gateway.handleConnection(client);
            expect(client.join).toHaveBeenCalledWith('user:user1');
        });

        it('should disconnect on invalid token', () => {
            const client: any = {
                handshake: { headers: { authorization: 'Bearer token' } },
                disconnect: jest.fn(),
            };
            jwtService.verify.mockImplementation(() => { throw new Error(); });

            gateway.handleConnection(client);
            expect(client.disconnect).toHaveBeenCalled();
        });
    });

    describe('sendNotification', () => {
        it('should emit newNotification event', () => {
            gateway.sendNotification('user1', { id: '1' } as any);
            expect(mockServer.to).toHaveBeenCalledWith('user:user1');
            expect(mockServer.emit).toHaveBeenCalledWith('newNotification', { id: '1' });
        });
    });

    describe('sendCartUpdate', () => {
        it('should emit cart_updated event', () => {
            gateway.sendCartUpdate('user1', { id: 'cart1' });
            expect(mockServer.to).toHaveBeenCalledWith('user:user1');
            expect(mockServer.emit).toHaveBeenCalledWith('cart_updated', { id: 'cart1' });
        });
    });
});
