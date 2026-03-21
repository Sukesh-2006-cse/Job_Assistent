const AgentMemory = require('../../models/AgentMemory');

/**
 * Reads a memory value for a specific user, agent, and key.
 * Deletes if expired.
 */
async function readMemory(userId, agentName, key) {
    const record = await AgentMemory.findOne({ userId, agentName, key });

    if (!record) return null;

    if (record.expiresAt && record.expiresAt < new Date()) {
        await AgentMemory.deleteOne({ _id: record._id });
        return null;
    }

    return record.value;
}

/**
 * Writes a memory value for a specific user, agent, and key.
 * ttlHours: Time-to-live in hours. If null, it never expires.
 */
async function writeMemory(userId, agentName, key, value, ttlHours = null) {
    let expiresAt = null;
    if (ttlHours !== null) {
        expiresAt = new Date(Date.now() + ttlHours * 3600000);
    }

    const savedDoc = await AgentMemory.findOneAndUpdate(
        { userId, agentName, key },
        { value, expiresAt },
        { upsert: true, new: true }
    );

    return savedDoc;
}

/**
 * Reads all memory for a user and groups it by agent name.
 */
async function readAllMemory(userId) {
    const records = await AgentMemory.find({ userId });
    const memoryMap = {};

    for (const record of records) {
        // Skip expired records
        if (record.expiresAt && record.expiresAt < new Date()) {
            continue;
        }

        if (!memoryMap[record.agentName]) {
            memoryMap[record.agentName] = {};
        }
        memoryMap[record.agentName][record.key] = record.value;
    }

    return memoryMap;
}

/**
 * Clears memory for a user. Optionally restricted to a specific agent.
 */
async function clearMemory(userId, agentName = null) {
    const query = { userId };
    if (agentName) {
        query.agentName = agentName;
    }

    const result = await AgentMemory.deleteMany(query);
    return { deleted: result.deletedCount };
}

module.exports = {
    readMemory,
    writeMemory,
    readAllMemory,
    clearMemory
};
