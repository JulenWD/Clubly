import axios, { AxiosInstance } from 'axios';
import { getFirebaseToken } from "../utils/getFirebaseToken";
import { auth } from "../firebase.config";
import { getIdToken } from "firebase/auth";

export const setupInterceptors = (accessToken: string | null, setAccessToken: (token: string | null) => void): AxiosInstance => {
    const api = axios.create({
        baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000',
        withCredentials: true,
        timeout: 30000
    })
    
    let isAuthenticating = false;
    let tokenExpirationTime = 0;
    let cachedToken: string | null = null;
    let failedRequests: Array<{ config: any, resolve: (value: any) => void, reject: (reason?: any) => void }> = [];

    api.interceptors.request.use(
        async (config) => {
            if (config.url === '/auth/login' || config.url === '/auth/register') {
                return config;
            }
            
            const now = Date.now();
            
            if (!isAuthenticating) {
                if (!cachedToken || now > tokenExpirationTime) {
                    try {
                        const isPagoContext = window.location.pathname.includes('/pago') || 
                            sessionStorage.getItem('clubly_pago_en_proceso') === 'true' ||
                            sessionStorage.getItem('clubly_pago_completado') === 'true';
                        
                        const freshToken = await getFirebaseToken(isPagoContext);
                        if (freshToken) {
                            cachedToken = freshToken;
                            tokenExpirationTime = now + (isPagoContext ? 1 * 60 * 1000 : 5 * 60 * 1000);
                            config.headers.Authorization = `Bearer ${freshToken}`;
                            setAccessToken(freshToken);
                        } else if (accessToken) {
                            config.headers.Authorization = `Bearer ${accessToken}`;
                        }
                    } catch (error) {
                        if (accessToken) {
                            config.headers.Authorization = `Bearer ${accessToken}`;
                        }
                    }
                } else {
                    config.headers.Authorization = `Bearer ${cachedToken}`;
                }
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    api.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config;
            
            if (!error.response) {
                if (window.location.pathname.includes('/pago') || 
                    sessionStorage.getItem('clubly_pago_en_proceso') === 'true' ||
                    sessionStorage.getItem('clubly_pago_completado') === 'true') {
                    
                    try {
                        const newToken = await getFirebaseToken(true);
                        if (newToken) {
                            setAccessToken(newToken);
                            cachedToken = newToken;
                            tokenExpirationTime = Date.now() + 60000;
                            
                            if (originalRequest) {
                                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                                return api(originalRequest);
                            }
                        }
                    } catch (refreshError) {
                    }
                }
                
                return Promise.reject(error);
            }
            
            if (
                error.response.status === 401 &&
                !originalRequest._retry &&
                originalRequest.url !== '/auth/login' &&
                originalRequest.url !== '/auth/refresh'
            ) {
                originalRequest._retry = true;
                
                if (isAuthenticating) {
                    return new Promise((resolve, reject) => {
                        failedRequests.push({ config: originalRequest, resolve, reject });
                    });
                }
                
                try {
                    isAuthenticating = true;
                    
                    if (window.location.pathname.includes('/pago') || 
                        sessionStorage.getItem('clubly_pago_en_proceso') === 'true' ||
                        sessionStorage.getItem('clubly_pago_completado') === 'true') {
                        
                        try {
                            const firebaseToken = await getFirebaseToken(true);
                            if (firebaseToken) {
                                const loginRes = await axios.post(
                                    (import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000') + '/auth/login',
                                    { idToken: firebaseToken },
                                    { withCredentials: true }
                                );
                                
                                if (loginRes.data && loginRes.data.accessToken) {
                                    const newToken = loginRes.data.accessToken;
                                    setAccessToken(newToken);
                                    cachedToken = newToken;
                                    tokenExpirationTime = Date.now() + 60000;
                                    
                                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                                    return api(originalRequest);
                                }
                            }
                        } catch (firebaseError) {
                        }
                    }
                    
                    const res = await axios.post(
                        (import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000') + '/auth/refresh',
                        {},
                        { withCredentials: true }
                    );
                    
                    if (res.data && res.data.accessToken) {
                        const newToken = res.data.accessToken;
                        setAccessToken(newToken);
                        cachedToken = newToken;
                        tokenExpirationTime = Date.now() + (5 * 60 * 1000);
                        
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        
                        failedRequests.forEach(request => {
                            request.config.headers.Authorization = `Bearer ${newToken}`;
                            request.resolve(api(request.config));
                        });
                        failedRequests = [];
                        
                        return api(originalRequest);
                    } else {
                        throw new Error("El servidor no devolvió un token válido");
                    }
                } catch (refreshError) {
                    failedRequests.forEach(request => {
                        request.reject(refreshError);
                    });
                    failedRequests = [];
                    
                    const isPagoRelated = window.location.pathname.includes('/pago') || 
                        sessionStorage.getItem('clubly_pago_en_proceso') === 'true' ||
                        sessionStorage.getItem('clubly_pago_completado') === 'true';
                        
                    if (isPagoRelated) {
                        try {
                            if (auth.currentUser) {
                                const lastResortToken = await getIdToken(auth.currentUser, true);
                                
                                if (lastResortToken) {
                                    const lastLoginAttempt = await axios.post(
                                        (import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000') + '/auth/login',
                                        { idToken: lastResortToken },
                                        { withCredentials: true }
                                    );
                                    
                                    if (lastLoginAttempt.data && lastLoginAttempt.data.accessToken) {
                                        setAccessToken(lastLoginAttempt.data.accessToken);
                                        
                                        if (originalRequest && (
                                            window.location.pathname.includes('/compra-exitosa') ||
                                            window.location.pathname.includes('/dashboard') || 
                                            sessionStorage.getItem('clubly_pago_completado') === 'true'
                                        )) {
                                            originalRequest.headers.Authorization = `Bearer ${lastLoginAttempt.data.accessToken}`;
                                            return api(originalRequest);
                                        }
                                    }
                                }
                            }
                        } catch (lastError) {
                        }
                    }
                    
                    return Promise.reject(refreshError);
                } finally {
                    isAuthenticating = false;
                }
            }
            
            return Promise.reject(error);
        }
    );

    return api;
}