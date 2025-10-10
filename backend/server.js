const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const config = require('./config');

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: function (origin, callback) {
            if (!origin) return callback(null, true);
            if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
                return callback(null, true);
            }
            if (origin === config.FRONTEND_URL) {
                return callback(null, true);
            }
            callback(new Error('Not allowed by CORS'));
        },
        methods: ["GET", "POST"]
    }
});

const PORT = config.PORT;

// Middleware
app.use(helmet());
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Allow localhost on any port for development
        if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
            return callback(null, true);
        }

        // Allow configured frontend URL
        if (origin === config.FRONTEND_URL) {
            return callback(null, true);
        }

        callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const eventRoutes = require('./routes/events');
const playerRoutes = require('./routes/players');

// Routes
app.use('/api/events', eventRoutes);
app.use('/api/players', playerRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Socket.io for real-time updates
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join event room
    socket.on('join-event', (eventId) => {
        socket.join(`event-${eventId}`);
        console.log(`Client ${socket.id} joined event ${eventId}`);
    });

    // Leave event room
    socket.on('leave-event', (eventId) => {
        socket.leave(`event-${eventId}`);
        console.log(`Client ${socket.id} left event ${eventId}`);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Make io available to routes
app.set('io', io);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
});

module.exports = { app, io };
