const mongoose = require('mongoose');

const agentMemorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    agentName: {
        type: String,
        required: true
    },
    key: {
        type: String,
        required: true
    },
    value: {
        type: mongoose.Schema.Types.Mixed
    },
    expiresAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Compound index for fast lookups and preventing duplicates
agentMemorySchema.index({ userId: 1, agentName: 1, key: 1 }, { unique: true });

const AgentMemory = mongoose.model('AgentMemory', agentMemorySchema);

module.exports = AgentMemory;
