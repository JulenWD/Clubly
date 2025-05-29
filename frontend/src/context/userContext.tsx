import {createContext, ReactNode, useContext, useEffect, useRef, useState} from "react";
import axios, {AxiosInstance} from "axios";
import {setupInterceptors} from "../services/Api.ts";
import {onAuthStateChanged, getIdToken, updateProfile} from "firebase/auth"
import { auth } from "../firebase.config.ts"

interface UserType {
    uid: string;
    email: string;
    nombre: string;
    rol: 'usuario' | 'dj' | 'propietario' | 'club' | 'admin';
    gustosMusicales?: string[]
    bio?: string;
    fotoPerfilUrl?: string;
    fotoPerfil?: string;
    dni?: string;
    verificado?: boolean;
    ciudad?: string;
    ubicacion?: string;
    clubId?: string;
}

interface UserContextType {
    user: UserType | null;
    setUser: React.Dispatch<React.SetStateAction<UserType | null>>;
    accessToken: string | null;
    setAccessToken: React.Dispatch<React.SetStateAction<string | null>>;
    api: AxiosInstance;
    authLoading: boolean;
}
export const UserContext = createContext<UserContextType>({
    user: null,
    setUser: () => {},
    accessToken: null,
    setAccessToken: () => {},
    api: axios.create(),
    authLoading: true
});

interface UserProviderProps {
    children: ReactNode;
}

export const UserProvider = ({ children }: UserProviderProps) => {
    const [user, setUser] = useState<UserType | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    
    const api = setupInterceptors(accessToken, setAccessToken);
      
    const isLoggingIn = useRef(false);
    const retryCount = useRef(0);
    const lastProfileFetch = useRef(0);
    const maxRetries = 3;
    const retryDelay = 60000;
      
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            const returningFromPayment = sessionStorage.getItem('clubly_pago_en_proceso') === 'true';
            const isPagoCompletado = sessionStorage.getItem('clubly_pago_completado') === 'true';
            const isCompraExitosaPage = window.location.pathname.includes('/compra-exitosa');
            
            const now = Date.now();
            const shouldFetchProfile = 
                !isLoggingIn.current && 
                (returningFromPayment || 
                isCompraExitosaPage ||
                isPagoCompletado ||
                retryCount.current < maxRetries || 
                now - lastProfileFetch.current > retryDelay);
                
            if (firebaseUser && shouldFetchProfile) {
                try {
                    isLoggingIn.current = true;
                    lastProfileFetch.current = now;
                      
                    const forceTokenRefresh = returningFromPayment || isPagoCompletado;
                    
                    let token;
                      
                    const savedToken = localStorage.getItem('clubly_auth_token');
                    
                    if (forceTokenRefresh) {
                        try {
                            token = await getIdToken(firebaseUser, true);
                        } catch (tokenError) {
                            if (savedToken) {
                                token = savedToken;
                            } else {
                                await new Promise(resolve => setTimeout(resolve, 1000));
                                try {
                                    token = await getIdToken(firebaseUser, true);
                                } catch (secondError) {
                                    token = await getIdToken(firebaseUser, false);
                                }
                            }
                        }
                    } else {
                        if (isPagoCompletado && savedToken) {
                            token = savedToken;
                        } else {
                            token = await getIdToken(firebaseUser, false);
                        }
                    }
                    
                    if (token) {
                        setAccessToken(token);
                        
                        if (savedToken) {
                            localStorage.removeItem('clubly_auth_token');
                        }
                    }
                    
                    if (returningFromPayment) {
                        sessionStorage.removeItem('clubly_pago_en_proceso');
                    }
                    
                    if (forceTokenRefresh) {
                        await new Promise(resolve => setTimeout(resolve, 800));
                    }
                      
                    const response = await api.post('/auth/login', {idToken: token});
                    
                    if (!response || !response.data || !response.data.perfil) {
                        throw new Error('No se pudo obtener el perfil del usuario');
                    }
                    
                    const perfil = response.data.perfil;
                    retryCount.current = 0;
                      
                    if (isPagoCompletado) {
                        localStorage.setItem('clubly_auth_token', token);
                    }
                    
                    setUser({
                        ...perfil,
                        fotoPerfilUrl: perfil.fotoPerfil || perfil.fotoPerfilUrl || "",
                        ciudad: perfil.ciudad || perfil.ubicacion || ""
                    });
                      
                    if (auth.currentUser && perfil.fotoPerfil) {
                        try {
                            await updateProfile(auth.currentUser, { photoURL: perfil.fotoPerfil });
                        } catch (e) {}
                    }
                } catch (err) {
                    retryCount.current += 1;
                    
                    if (retryCount.current > maxRetries) {
                        setUser(null);
                        setAccessToken(null);
                    }
                } finally {
                    isLoggingIn.current = false;
                }
            } else if (!firebaseUser) {
                setUser(null);
                setAccessToken(null);
            }
            setAuthLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <UserContext.Provider value={{user, setUser, accessToken, setAccessToken, api, authLoading}}>
            {children}
        </UserContext.Provider>
    );
};

export const useUserContext = () => useContext(UserContext);
