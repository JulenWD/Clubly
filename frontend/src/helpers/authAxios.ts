import axios from "axios";
import { auth } from "../firebase.config.ts";
import { getFirebaseToken } from "../utils/getFirebaseToken";

const authAxios = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'
});

let isGettingToken = false;

authAxios.interceptors.request.use(async (config) => {
    if (isGettingToken) {
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    try {
        isGettingToken = true;
        
        let token = await getFirebaseToken();
        
        if (!token && auth.currentUser) {
            try {
                token = await auth.currentUser.getIdToken(true);
            } catch (e) {
                console.warn("Error al obtener token fresco:", e);
            }
        }
        
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch (error) {
        console.error("Error obteniendo token para autenticación:", error);
    } finally {
        isGettingToken = false;
    }
    
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default authAxios;
