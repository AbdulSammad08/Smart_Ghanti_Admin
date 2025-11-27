const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth-db');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const subscriptionRoutes = require('./routes/subscriptions');
const transferRoutes = require('./routes/transfers');
const paymentRoutes = require('./routes/payments');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-app-name.vercel.app', 'https://*.vercel.app']
    : 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Add request logging for debugging
app.use((req, res, next) => {
  if (req.path.includes('/auth/admin/login')) {
    console.log(`🔐 Login attempt: ${req.body?.email} at ${new Date().toISOString()}`);
    console.log(`🔗 Database status: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
  }
  next();
});

// Database connection with retry logic
const connectDB = async (retries = 5) => {
  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
        maxPoolSize: 10,
        retryWrites: false,
        authSource: 'admin'
      });
      console.log('✅ Connected to MongoDB successfully');
      return true;
    } catch (err) {
      console.error(`❌ MongoDB connection attempt ${i + 1} failed:`, err.message);
      if (i < retries - 1) {
        console.log(`⚠️  Retrying in 3 seconds... (${retries - i - 1} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
  }
  return false;
};

// Handle connection events
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected - attempting to reconnect...');
  setTimeout(connectDB, 5000);
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected successfully');
});

mongoose.connection.on('connected', () => {
  console.log('MongoDB connected event triggered');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/payments', paymentRoutes);

// Health check
app.get('/api/health', async (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const dbStatusText = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  }[dbStatus] || 'unknown';
  
  let dbTest = false;
  if (dbStatus === 1) {
    try {
      // Test actual database operation
      await mongoose.connection.db.admin().ping();
      dbTest = true;
    } catch (error) {
      console.error('Database ping failed:', error.message);
    }
  }
  
  res.json({ 
    status: dbStatus === 1 && dbTest ? 'OK' : 'ERROR',
    message: 'Server is running',
    database: dbStatusText,
    databaseTest: dbTest,
    timestamp: new Date().toISOString()
  });
});

// Start server after database connection
const startServer = async () => {
  console.log('🔄 Initializing server...');
  console.log('🔄 Connecting to Azure Cosmos DB...');
  
  const dbConnected = await connectDB();
  
  if (dbConnected) {
    // Wait a bit more to ensure connection is stable
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log('\n🎉 SERVER READY!');
      console.log('=====================================');
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 Frontend URL: http://localhost:3000`);
      console.log(`🔗 Backend URL: http://localhost:${PORT}`);
      console.log('✅ Database connected and stable');
      console.log('✅ Ready to accept login requests');
      console.log('=====================================\n');
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        mongoose.connection.close();
        process.exit(0);
      });
    });
    
  } else {
    console.log('❌ Failed to connect to database after multiple attempts.');
    console.log('Please check your connection string and try again.');
    process.exit(1);
  }
};

startServer();