import { JSX, useEffect, useState } from "react";
import { useUserContext } from "../context/userContext.tsx";
import { Navigate } from "react-router-dom";
import { auth } from "../firebase.config";
import { getIdToken } from "firebase/auth";
import axios from "axios";

interface ProtectedRouteProps {
    children: JSX.Element
    requiredRole?: "usuario" | "dj" | "propietario" | "admin"
}

const ProtectedRoute = ({ children, requiredRole}: ProtectedRouteProps) => {
    const { user, setAccessToken, authLoading } = useUserContext();
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationCompleted, setVerificationCompleted] = useState(false);

    const isPagoCompletado = sessionStorage.getItem('clubly_pago_completado') === 'true';
    const savedToken = localStorage.getItem('clubly_auth_token');
    
    useEffect(() => {
        if (!user && !authLoading && (isPagoCompletado || savedToken) && !isVerifying && !verificationCompleted) {
            const verifySession = async () => {
                setIsVerifying(true);
                
                try {
                    if (auth.currentUser) {
                        const token = savedToken || await getIdToken(auth.currentUser, true);
                        
                        setAccessToken(token);
                        
                        await axios.post(
                            `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/auth/login`, 
                            { idToken: token },
                            { withCredentials: true }
                        );
                        
                        window.location.reload();
                    }
                } catch (error) {
                } finally {
                    setIsVerifying(true);
                    setVerificationCompleted(true);
                    if (savedToken) {
                        localStorage.removeItem('clubly_auth_token');
                    }
                }
            };
            
            verifySession();
        }
    }, [user, authLoading, isPagoCompletado, savedToken, isVerifying, verificationCompleted, setAccessToken]);

    if (isVerifying && !verificationCompleted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="text-center">
                    <div className="spinner-border text-purple-500" role="status">
                        <span className="visually-hidden">Verificando sesión...</span>
                    </div>
                    <p className="mt-3 text-lg text-gray-300">Verificando tu sesión...</p>
                </div>
            </div>
        );
    }

    if(!user && !isVerifying) {
        return <Navigate to="/login" replace/>
    }
    
    if (user && requiredRole && user.rol !== requiredRole) {
        return <Navigate to="/eventos" replace/>
    }

    return children
}

export default ProtectedRoute