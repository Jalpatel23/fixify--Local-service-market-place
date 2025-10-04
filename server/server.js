const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const logger = require('./utils/logger');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

// Clerk auth (SDK)
let ClerkExpressWithAuth;
try {
  ({ ClerkExpressWithAuth } = require('@clerk/clerk-sdk-node'));
} catch (e) {
  ClerkExpressWithAuth = null;
}

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Attach Clerk auth middleware early if available
if (ClerkExpressWithAuth) {
  app.use(ClerkExpressWithAuth());
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fixify', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Import routes
const { authRoutes, jobRoutes, browseRoutes } = require('./routes');
const messageRoutes = require('./routes/messages');
const reviewRoutes = require('./routes/reviews');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payments');
const searchRoutes = require('./routes/search');

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Fixify API is running!' });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/browse', browseRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/search', searchRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join user to their personal room
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });

  // Handle new message
  socket.on('send_message', (data) => {
    // Broadcast to recipient
    socket.to(data.recipientId).emit('new_message', data);
  });

  // Handle typing indicator
  socket.on('typing', (data) => {
    socket.to(data.recipientId).emit('user_typing', {
      userId: data.senderId,
      isTyping: true
    });
  });

  // Handle stop typing
  socket.on('stop_typing', (data) => {
    socket.to(data.recipientId).emit('user_typing', {
      userId: data.senderId,
      isTyping: false
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}); 