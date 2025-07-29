import { createClient } from 'redis';

const redisClient = createClient();

redisClient.on('error', (err) => console.error('Redis Client Error', err));

redisClient.connect(); // Connect when server starts

export default redisClient;