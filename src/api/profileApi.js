import apiClient from './apiClient';

export const getProfile = async () => {
    const response = await apiClient.get('/profile');
    return response.data;
};

export const uploadResume = async (file) => {
    const formData = new FormData();
    formData.append('resume', file);

    const response = await apiClient.post('/profile/upload-resume', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};
