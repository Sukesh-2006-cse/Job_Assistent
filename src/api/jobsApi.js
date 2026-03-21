import apiClient from './apiClient';

export const getAllJobs = async () => {
    const response = await apiClient.get('/job-tracker');
    return response.data;
};

export const createJob = async (jobData) => {
    const response = await apiClient.post('/job-tracker', jobData);
    return response.data;
};

export const updateJob = async (id, jobData) => {
    const response = await apiClient.put(`/job-tracker/${id}`, jobData);
    return response.data;
};

export const deleteJob = async (id) => {
    const response = await apiClient.delete(`/job-tracker/${id}`);
    return response.data;
};
