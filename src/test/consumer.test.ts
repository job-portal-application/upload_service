// consumer.test.ts

import { jest, describe, beforeEach, expect, it } from '@jest/globals';

const mockConsumerConnect = jest.fn<any>();
const mockConsumerSubscribe = jest.fn<any>();
const mockConsumerRun = jest.fn<any>();

const mockSendMail = jest.fn<any>();

const mockConsumer = {
    connect: mockConsumerConnect,
    subscribe: mockConsumerSubscribe,
    run: mockConsumerRun,
};

const mockKafkaInstance = {
    consumer: jest.fn(() => mockConsumer),
};

const mockKafka = jest.fn(() => mockKafkaInstance);

const mockCreateTransport = jest.fn(() => ({
    sendMail: mockSendMail,
}));

const mockDotenvConfig = jest.fn();

type EachMessageHandler = (payload: {
    topic: string;
    partition: number;
    message: { value: Buffer };
}) => Promise<void>;

jest.unstable_mockModule('kafkajs', () => ({
    Kafka: mockKafka,
}));

jest.unstable_mockModule('nodemailer', () => ({
    default: {
        createTransport: mockCreateTransport,
    },
}));

jest.unstable_mockModule('dotenv', () => ({
    default: {
        config: mockDotenvConfig,
    },
}));

describe('mail consumer', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();

        process.env.KAFKA_BROKER = 'localhost:9092';
        process.env.APP_EMAIL = 'test@gmail.com';
        process.env.APP_PASSWORD = 'password';

        mockConsumerConnect.mockResolvedValue(undefined);
        mockConsumerSubscribe.mockResolvedValue(undefined);
        mockConsumerRun.mockResolvedValue(undefined);
        mockSendMail.mockResolvedValue(undefined);
    });

    it('should connect kafka consumer successfully', async () => {
        const consoleSpy = jest
            .spyOn(console, 'log')
            .mockImplementation(() => {});

        const { startSendMailConsumer } =
            await import('../../src/consumer.js');

        await startSendMailConsumer();

        expect(mockKafka as any).toHaveBeenCalledWith({
            clientId: 'mail-service',
            brokers: ['localhost:9092'],
        });

        expect(mockConsumerConnect).toHaveBeenCalled();

        expect(mockConsumerSubscribe).toHaveBeenCalledWith({
            topic: 'send-mail',
            fromBeginning: false,
        });

        expect(consoleSpy).toHaveBeenCalledWith(
            'Mail service consumer connected to Kafka and subscribed to topic'
        );

        consoleSpy.mockRestore();
    });

    it('should run kafka consumer', async () => {
        const { startSendMailConsumer } =
            await import('../../src/consumer.js');

        await startSendMailConsumer();

        expect(mockConsumerRun).toHaveBeenCalled();
    });

    it('should send email successfully', async () => {
        mockConsumerRun.mockImplementation(
            async ({ eachMessage }: any) => {
                await eachMessage({
                    topic: 'send-mail',
                    partition: 0,
                    message: {
                        value: Buffer.from(
                            JSON.stringify({
                                to: 'test@test.com',
                                subject: 'Test',
                                html: '<h1>Hello</h1>',
                            })
                        ),
                    },
                });
            }
        );

        const consoleSpy = jest
            .spyOn(console, 'log')
            .mockImplementation(() => {});

        const { startSendMailConsumer } =
            await import('../../src/consumer.js');

        await startSendMailConsumer();

        expect(mockCreateTransport as any).toHaveBeenCalledWith({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: 'test@gmail.com',
                pass: 'password',
            },
        });

        expect(mockSendMail as any).toHaveBeenCalledWith({
            from: 'Hireheaven <no-reply>',
            to: 'test@test.com',
            subject: 'Test',
            html: '<h1>Hello</h1>',
        });

        expect(consoleSpy).toHaveBeenCalledWith(
            'Mail has been sent to test@test.com'
        );

        consoleSpy.mockRestore();
    });

    it('should handle email sending failure', async () => {
        mockSendMail.mockRejectedValue(
            new Error('Mail failed')
        );

        mockConsumerRun.mockImplementation(
            async ({ eachMessage }: any) => {
                await eachMessage({
                    topic: 'send-mail',
                    partition: 0,
                    message: {
                        value: Buffer.from(
                            JSON.stringify({
                                to: 'test@test.com',
                                subject: 'Test',
                                html: '<h1>Hello</h1>',
                            })
                        ),
                    },
                });
            }
        );

        const consoleSpy = jest
            .spyOn(console, 'log')
            .mockImplementation(() => {});

        const { startSendMailConsumer } =
            await import('../../src/consumer.js');

        await startSendMailConsumer();

        expect(consoleSpy).toHaveBeenCalledWith(
            'Failed to send email',
            expect.any(Error)
        );

        consoleSpy.mockRestore();
    });

    it('should handle invalid message payload', async () => {
        mockConsumerRun.mockImplementation(
    async ({ eachMessage }: any) => {
        await eachMessage({
            topic: 'send-mail',
            partition: 0,
            message: {
                value: Buffer.from('invalid-json'),
            },
        });
    }
);

        const consoleSpy = jest
            .spyOn(console, 'log')
            .mockImplementation(() => {});

        const { startSendMailConsumer } =
            await import('../../src/consumer.js');

        await startSendMailConsumer();

        expect(consoleSpy).toHaveBeenCalledWith(
            'Failed to send email',
            expect.any(Error)
        );

        consoleSpy.mockRestore();
    });

    it('should handle kafka consumer startup failure', async () => {
        mockConsumerConnect.mockRejectedValue(
            new Error('Kafka failed')
        );

        const consoleSpy = jest
            .spyOn(console, 'log')
            .mockImplementation(() => {});

        const { startSendMailConsumer } =
            await import('../../src/consumer.js');

        await startSendMailConsumer();

        expect(consoleSpy).toHaveBeenCalledWith(
            'Failed to start kafka consumer',
            expect.any(Error)
        );

        consoleSpy.mockRestore();
    });
});