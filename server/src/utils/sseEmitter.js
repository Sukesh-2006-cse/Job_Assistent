// SSE Emitter — manages active SSE connections per userId
// Connections map: userId (string) → res (Express Response)
const connections = new Map();

/**
 * Register a new SSE connection for a user.
 * @param {string} userId
 * @param {object} res - Express response object
 */
function addConnection(userId, res) {
    connections.set(String(userId), res);
}

/**
 * Remove a connection (on client disconnect).
 * @param {string} userId
 */
function removeConnection(userId) {
    connections.delete(String(userId));
}

/**
 * Emit a named SSE event to a specific user.
 * @param {string} userId
 * @param {string} eventName
 * @param {object} data
 */
function emitToUser(userId, eventName, data) {
    const res = connections.get(String(userId));
    if (res && !res.writableEnded) {
        try {
            res.write(`event: ${eventName}\n`);
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        } catch (e) {
            // Connection may have dropped — clean up
            removeConnection(userId);
        }
    }
}

module.exports = { addConnection, removeConnection, emitToUser };
