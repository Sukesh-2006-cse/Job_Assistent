import apiClient from './apiClient';

export const getAnalyticsSummary = async () => {
    const response = await apiClient.get('/analytics/summary');
    return response.data;
};
