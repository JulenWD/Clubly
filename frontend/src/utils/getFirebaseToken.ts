import { getAuth, getIdToken } from "firebase/auth"

export const getFirebaseToken = async (forceRefresh = false) => {
    const user = getAuth().currentUser;
    
    if (!user) {
        return null;
    }
    
    try {
        const isPagoContext = window.location.pathname.includes('/pago') || 
            sessionStorage.getItem('clubly_pago_en_proceso') === 'true' ||
            sessionStorage.getItem('clubly_pago_completado') === 'true';
        
        const shouldForceRefresh = forceRefresh || isPagoContext;
        
        if (isPagoContext) {
            try {
                return await getIdToken(user, true);
            } catch (firstError) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                try {
                    return await getIdToken(user, true);
                } catch (secondError) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    return await getIdToken(user, false);
                }
            }
        }
        
        return await user.getIdToken(shouldForceRefresh);
    } catch (error) {
        if (forceRefresh) {
            try {
                await new Promise(resolve => setTimeout(resolve, 500));
                return await user.getIdToken(false);
            } catch (secondError) {
                console.error("Error obteniendo token después de múltiples intentos", secondError);
                return null;
            }
        }
        console.error("Error obteniendo token", error);
        return null;
    }
}