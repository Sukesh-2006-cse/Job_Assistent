const { readMemory, writeMemory } = require('../memory/memoryStore');

class BaseAgent {
    constructor(agentName) {
        this.agentName = agentName;
    }

    async readMemory(userId, key) {
        return readMemory(userId, this.agentName, key);
    }

    async writeMemory(userId, key, value, ttlHours = null) {
        return writeMemory(userId, this.agentName, key, value, ttlHours);
    }

    async run(context) {
        throw new Error('Agent must implement run() method');
    }
}

module.exports = BaseAgent;
