import axios from 'axios';

const API = axios.create({
    baseURL: 'https://localhost:7096/api', // Make sure this matches your API port!
});

// This automatically adds the JWT token to every request if the user is logged in
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default API;