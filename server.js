const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Translation routes
app.use('/api/translate', require('./routes/translation'));
app.use('/api/languages', require('./routes/languages'));
app.use('/api/history', require('./routes/history'));
app.use('/api/audio', require('./routes/audio'));

// Health check endpoint for monitoring
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        features: {
            customDictionaries: true,
            offlineCache: true,
            googleTranslate: !!process.env.GOOGLE_TRANSLATE_API_KEY
        }
    });
});

// Serve the main application
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌍 Universal Translator Server running on port ${PORT}`);
    if (process.env.NODE_ENV === 'production') {
        console.log(`🚀 Production mode - Server ready for deployment`);
    } else {
        console.log(`📱 Access the app at: http://localhost:${PORT}`);
    }
});

module.exports = app;
