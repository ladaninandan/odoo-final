import express from 'express';
import { createServer } from 'http';
import { Server as SocketIO } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import productsRoutes from './routes/products.routes.js';
import categoriesRoutes from './routes/categories.routes.js';
import floorsRoutes from './routes/floors.routes.js';
import tablesRoutes from './routes/tables.routes.js';
import ordersRoutes from './routes/orders.routes.js';
import kitchenRoutes from './routes/kitchen.routes.js';
import paymentsRoutes from './routes/payments.routes.js';
import sessionsRoutes from './routes/sessions.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import selfOrderRoutes from './routes/selfOrder.routes.js';
import usersRoutes from './routes/users.routes.js';
import { errorHandler, notFoundHandler } from './middlewares/errorMiddleware.js';
import registerSocketHandlers from './socket/socketHandlers.js';

dotenv.config();

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to MongoDB
connectDB();

const app = express();
const httpServer = createServer(app);

// Socket.IO setup
const io = new SocketIO(httpServer, {
  cors: {
    origin: 'http://localhost:3000',
    credentials: true,
  },
});
registerSocketHandlers(io);

// Make io accessible to controllers via req.app
app.set('io', io);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Security HTTP Headers
app.use(helmet());

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
});
app.use('/api/', limiter);

// CORS setup
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
}));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/floors', floorsRoutes);
app.use('/api/tables', tablesRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/kitchen', kitchenRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/self-order', selfOrderRoutes);
app.use('/api/users', usersRoutes);

app.get('/', (req, res) => {
    res.send('API is running...');
});

// Global Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => console.log(`Server running on port ${PORT} (HTTP + Socket.IO)`));
