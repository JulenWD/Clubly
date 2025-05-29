import { EventoDestacado } from '../types/EventoDestacado';
import axios from 'axios';
import { getFirebaseToken } from "../utils/getFirebaseToken";

const api = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000',
    withCredentials: true
});

api.interceptors.request.use(
    async (config) => {
        try {
            const freshToken = await getFirebaseToken();
            if (freshToken) {
                config.headers.Authorization = `Bearer ${freshToken}`;
            }
        } catch (error) {
        }
        return config;
    },
    error => Promise.reject(error)
);

export const EventoDestacadoService = {
    solicitarDestacarEvento: async (eventoId: string, clubId: string, ciudad: string): Promise<EventoDestacado> => {
        try {
            await getFirebaseToken(true);
            
            const response = await api.post(`/eventos-destacados/solicitar/${eventoId}`, {
                clubId,
                ciudad
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    
    obtenerEventosDestacadosPorCiudad: async (ciudad: string) => {
        try {
            const response = await api.get(`/eventos-destacados/ciudad/${ciudad}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    
    verificarEventoDestacado: async (eventoId: string) => {
        try {
            const response = await api.get(`/eventos-destacados/verificar/${eventoId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    
    contarEventosDestacadosPorCiudad: async (ciudad: string) => {
        try {
            const response = await api.get(`/eventos-destacados/contar/${ciudad}`);
            return response.data.total;
        } catch (error) {
            throw error;
        }
    },
    
    obtenerSolicitudesPorClub: async (clubId: string) => {
        try {
            await getFirebaseToken(true);
            const response = await api.get(`/eventos-destacados/club/${clubId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    
    obtenerSolicitudesPendientes: async () => {
        try {
            const freshToken = await getFirebaseToken();
            if (!freshToken) {
                throw new Error("No autorizado - Token no disponible");
            }
            
            const response = await api.get('/eventos-destacados/solicitudes', {
                headers: {
                    Authorization: `Bearer ${freshToken}`
                }
            });
            return response.data || {};
        } catch (error) {
            throw error;
        }
    },
    
    aprobarSolicitud: async (solicitudId: string) => {
        try {
            const freshToken = await getFirebaseToken();
            if (!freshToken) {
                throw new Error("No autorizado - Token no disponible");
            }
            
            const response = await api.put(`/eventos-destacados/aprobar/${solicitudId}`, {}, {
                headers: {
                    Authorization: `Bearer ${freshToken}`
                }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    
    denegarSolicitud: async (solicitudId: string) => {
        try {
            const freshToken = await getFirebaseToken();
            if (!freshToken) {
                throw new Error("No autorizado - Token no disponible");
            }
            
            const response = await api.put(`/eventos-destacados/denegar/${solicitudId}`, {}, {
                headers: {
                    Authorization: `Bearer ${freshToken}`
                }
            });
            
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};
