import apiClient from './apiClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

/**
 * Send a message to Butler and return a ReadableStream response.
 * Uses native fetch (not axios) to support streaming chunks.
 * @param {string} message - The user's message
 * @param {Array} history - Previous conversation messages [{role, content}]
 * @returns {Promise<Response>} - The raw fetch Response (read as stream)  
 */
export async function sendChatMessage(message, history = []) {
    const token = localStorage.getItem('token');

    const response = await fetch(`${API_URL}/api/chat/message`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message, history }),
    });

    if (!response.ok) {
        throw new Error(`Chat request failed: ${response.status}`);
    }

    return response;
}

// Re-export butler API for context suggestions
export { getButlerToday } from './butlerApi';
