import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function mediaUrl(id) {
  const token = localStorage.getItem('token');
  // The /media route accepts ?token= so <img>/<video> tags can authenticate.
  return `${baseURL}/media/${id}?token=${encodeURIComponent(token || '')}`;
}

// Same endpoint but the server will set Content-Disposition: attachment so the
// browser actually saves the file rather than opening it inline.
export function mediaDownloadUrl(id) {
  return `${mediaUrl(id)}&download=1`;
}
