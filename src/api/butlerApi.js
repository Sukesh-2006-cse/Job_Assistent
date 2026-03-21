import apiClient from './apiClient';

export const getButlerToday = async () => {
    const response = await apiClient.get('/butler/today');
    return response.data;
};

export const markActionDone = async (jobId) => {
    const response = await apiClient.post(`/butler/markdone/${jobId}`);
    return response.data;
};

export const runOrchestrator = async (trigger, context = {}) => {
    const response = await apiClient.post('/butler/orchestrate', { trigger, context });
    return response.data;
};

export const getPrepKit = async (jobId) => {
    const response = await apiClient.get(`/butler/prep/${jobId}`);
    return response.data;
};

export const getCareerRoadmap = async () => {
    const response = await apiClient.get('/butler/career');
    return response.data;
};

export const getBriefing = async () => {
    const response = await apiClient.get('/butler/briefing');
    return response.data;
};

export const generateBriefing = async () => {
    const response = await apiClient.post('/butler/briefing/generate');
    return response.data;
};
