require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { apiLimiter } = require('./middleware/rateLimiter');
const { errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const chatRoutes = require('./routes/chat.routes');
const symptomsRoutes = require('./routes/symptoms.routes');
const articlesRoutes = require('./routes/articles.routes');
const doctorsRoutes = require('./routes/doctors.routes');
const advisorsRoutes = require('./routes/advisors.routes');
const notificationsRoutes = require('./routes/notifications.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

app.use(helmet());

const allowedOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error(`CORS: Origin '${origin}' not allowed.`));
            }
        },
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    })
);

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api', apiLimiter);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'ThyroCare API' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/symptoms', symptomsRoutes);
app.use('/api/v1/articles', articlesRoutes);
app.use('/api/v1/doctors', doctorsRoutes);
app.use('/api/v1/advisors', advisorsRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/admin', adminRoutes);

app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.path}` });
});

app.use(errorHandler);

if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`
  ╔════════════════════════════════════════╗
  ║      ThyroCare API is running!         ║
  ║  URL:  http://localhost:${PORT}           ║
  ║  ENV:  ${process.env.NODE_ENV || 'development'}                   ║
  ╚════════════════════════════════════════╝
  `);
    });
}

module.exports = app;
