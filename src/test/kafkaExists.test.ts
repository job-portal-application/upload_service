// ensureTopicExists.test.ts

import { jest, describe, beforeEach, expect, it } from '@jest/globals';

const mockAdminConnect = jest.fn<any>();
const mockAdminListTopics = jest.fn<any>();
const mockAdminCreateTopics = jest.fn<any>();
const mockAdminDisconnect = jest.fn<any>();

const mockAdmin = {
    connect: mockAdminConnect,
    listTopics: mockAdminListTopics,
    createTopics: mockAdminCreateTopics,
    disconnect: mockAdminDisconnect,
};

const mockKafkaInstance = {
    admin: jest.fn(() => mockAdmin),
};

const mockKafka = jest.fn(() => mockKafkaInstance);

jest.unstable_mockModule('kafkajs', () => ({
    Kafka: mockKafka,
}));

describe('ensureTopicExists', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();

        process.env.KAFKA_BROKER = 'localhost:9092';

        mockAdminConnect.mockResolvedValue(undefined);
        mockAdminCreateTopics.mockResolvedValue(undefined);
        mockAdminDisconnect.mockResolvedValue(undefined);
    });

    it('should create kafka instance with broker', async () => {
        mockAdminListTopics.mockResolvedValue([]);

        const { ensureTopicExists } =
            await import('../kafkaExists.js');

        await ensureTopicExists();

        expect(mockKafka as any).toHaveBeenCalledWith({
            clientId: 'mail-service',
            brokers: ['localhost:9092'],
        });
    });

    it('should connect admin successfully', async () => {
        mockAdminListTopics.mockResolvedValue([]);

        const { ensureTopicExists } =
            await import('../kafkaExists.js');

        await ensureTopicExists();

        expect(mockAdminConnect).toHaveBeenCalled();
    });

    it('should create topic if topic does not exist', async () => {
        mockAdminListTopics.mockResolvedValue([]);

        const consoleSpy = jest
            .spyOn(console, 'log')
            .mockImplementation(() => {});

        const { ensureTopicExists } =
            await import('../kafkaExists.js');

        await ensureTopicExists();

        expect(mockAdminCreateTopics).toHaveBeenCalledWith({
            topics: [
                {
                    topic: 'send-mail',
                    numPartitions: 1,
                    replicationFactor: 1,
                },
            ],
        });

        expect(consoleSpy).toHaveBeenCalledWith(
            'Topic send-mail created'
        );

        consoleSpy.mockRestore();
    });

    it('should not create topic if topic already exists', async () => {
        mockAdminListTopics.mockResolvedValue([
            'send-mail',
        ]);

        const consoleSpy = jest
            .spyOn(console, 'log')
            .mockImplementation(() => {});

        const { ensureTopicExists } =
            await import('../kafkaExists.js');

        await ensureTopicExists();

        expect(mockAdminCreateTopics).not.toHaveBeenCalled();

        expect(consoleSpy).toHaveBeenCalledWith(
            'Topic send-mail already exists'
        );

        consoleSpy.mockRestore();
    });

    it('should disconnect admin after execution', async () => {
        mockAdminListTopics.mockResolvedValue([]);

        const { ensureTopicExists } =
            await import('../kafkaExists.js');

        await ensureTopicExists();

        expect(mockAdminDisconnect).toHaveBeenCalled();
    });
});