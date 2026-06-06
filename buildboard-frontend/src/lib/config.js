const DEFAULT_API_URL = 'https://build-board-7x3a.vercel.app/api';

export const API_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/$/, '');
export const SOCKET_URL = API_URL.replace(/\/api$/, '');
