import axios, { AxiosInstance } from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';

// Usar rutas con /api/ que están protegidas con Cognito
const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || '';
const API_BASE_PATH = '/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_ENDPOINT + API_BASE_PATH,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para agregar el token de Cognito a las peticiones
    this.api.interceptors.request.use(
      async (config) => {
        try {
          const session = await fetchAuthSession();
          if (session.tokens?.idToken) {
            config.headers.Authorization = `Bearer ${session.tokens.idToken.toString()}`;
          }
        } catch (error) {
          console.error('Error obteniendo token:', error);
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptor para manejar errores de autenticación
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('isAuthenticated');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  get instance(): AxiosInstance {
    return this.api;
  }
}

export default new ApiService().instance;
