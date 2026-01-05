import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { config } from './src/config/index.js';
import { prisma } from './src/config/database.js';

// Import routes
import healthRoutes from './src/routes/health.js';
import searchRoutes from './src/routes/search.js';
import chatRoutes from './src/routes/chat.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/chat', chatRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Clinikally API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(config.port, () => {
  console.log(`Server is running on http://localhost:${config.port}`);
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export { app };
