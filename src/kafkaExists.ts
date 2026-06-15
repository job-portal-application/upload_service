import { Kafka } from 'kafkajs';

export const ensureTopicExists = async () => {
  const kafka = new Kafka({
    clientId: 'mail-service',
    brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
  });

  const admin = kafka.admin();
  await admin.connect();

  const topics = await admin.listTopics();
  if (!topics.includes('send-mail')) {
    await admin.createTopics({
      topics: [
        {
          topic: 'send-mail',
          numPartitions: 1,
          replicationFactor: 1,
        },
      ],
    });
    console.log('Topic send-mail created');
  } else {
    console.log('Topic send-mail already exists');
  }

  await admin.disconnect();
};
