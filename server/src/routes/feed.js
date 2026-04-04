const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { addConnection, removeConnection } = require('../utils/sseEmitter');

// GET /api/feed/activity — SSE stream for agent activity
router.get('/activity', authMiddleware, (req, res) => {
    const userId = req.user._id || req.user.id;

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    // Register this connection
    addConnection(userId, res);

    // Send initial connected event
    res.write('event: connected\n');
    res.write(`data: ${JSON.stringify({ message: 'Feed connected' })}\n\n`);

    // Heartbeat every 25 seconds to keep connection alive
    const heartbeat = setInterval(() => {
        if (!res.writableEnded) {
            res.write(': heartbeat\n\n');
        } else {
            clearInterval(heartbeat);
        }
    }, 25000);

    // Clean up on disconnect
    req.on('close', () => {
        clearInterval(heartbeat);
        removeConnection(userId);
    });
});

module.exports = router;
