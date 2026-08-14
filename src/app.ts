import express from 'express';
import dotenv from 'dotenv';
import router from './routes/routes.js';
import cors from 'cors';
import './cloudinary/index.js'
import { startSendMailConsumer } from './consumer.js';

dotenv.config();

startSendMailConsumer();

const app = express();
app.use(cors());
app.use(express.json({limit: '100mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true}));

// Health check endpoint added to verify the service is running
app.get('/', (req, res) => {
  res.status(200).json({
    status: "UP",
    service: "Upload Service",
    timestamp: new Date().toISOString()
  });
});

app.use('/api/v1/misc', router);


export default app;