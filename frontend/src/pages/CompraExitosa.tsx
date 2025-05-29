import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/Button';
import { useUserContext } from '../context/userContext';
import { auth } from '../firebase.config';
import { getIdToken } from 'firebase/auth';
import axios from 'axios';
import jsPDF from 'jspdf';
import * as QRCodeGen from 'qrcode';
import authAxios from '../helpers/authAxios';
import QRCode from 'react-qr-code';

export default function CompraExitosa() {
    const navigate = useNavigate();
    const location = useLocation();
    const evento = new URLSearchParams(location.search).get('evento');
    const { setAccessToken, user } = useUserContext();
    
    const [entradaInfo, setEntradaInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const refreshUserToken = async () => {
            if (auth.currentUser) {
                try {
                    const freshToken = await getIdToken(auth.currentUser, true);
                    setAccessToken(freshToken);
                    
                    const api = axios.create({
                        baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000',
                        withCredentials: true,
                        timeout: 30000
                    });
                    
                    await api.post('/auth/login', { idToken: freshToken });
                } catch (error) {
                    if (auth.currentUser) {
                        try {
                            await new Promise(resolve => setTimeout(resolve, 2000));
                            const backupToken = await getIdToken(auth.currentUser);
                            setAccessToken(backupToken);
                            
                            const api = axios.create({
                                baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000',
                                withCredentials: true,
                                timeout: 30000
                            });
                            
                            await api.post('/auth/login', { idToken: backupToken });
                        } catch (backupError) {
                        }
                    }
                }
            }
        };
        
        refreshUserToken();
        
        const tokenRefreshInterval = setInterval(refreshUserToken, 15000);
        
        return () => {
            clearInterval(tokenRefreshInterval);
        };
    }, [setAccessToken]);    
    useEffect(() => {
        const fetchEntrada = async () => {
            if (user && user.uid) {                
                try {
                    setLoading(true);                    
                    const response = await authAxios.get('/entradas/ultima');
                    if (response.data) {
                        setEntradaInfo(response.data);
                    }
                } catch (error) {
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchEntrada();
    }, [user]);

    useEffect(() => {
        sessionStorage.setItem('clubly_pago_completado', 'true');
        
        const redirectTimer = setTimeout(() => {
            if (auth.currentUser) {
                getIdToken(auth.currentUser, true)
                    .then(token => {
                        localStorage.setItem('clubly_auth_token', token);
                        
                        window.location.href = '/dashboard';
                    })                    
                    .catch(() => {
                        navigate('/dashboard');
                    });
            } else {
                navigate('/dashboard');
            }
        }, 30000);

        return () => {
            clearTimeout(redirectTimer);
        };
    }, [navigate, user]);    
    const descargarEntradaPDF = async () => {
        if (!entradaInfo || !user) return;
        
        try {
            const doc = new jsPDF();
            
            doc.setFillColor(81, 33, 122);
            doc.rect(0, 0, 210, 20, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.text('CLUBLY', 105, 14, { align: 'center' });
            
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(18);
            doc.text('Entrada para evento', 105, 35, { align: 'center' });
            
            doc.setDrawColor(81, 33, 122);
            doc.line(20, 40, 190, 40);
            
            doc.setFillColor(240, 240, 250);
            doc.rect(20, 45, 170, 10, 'F');
            doc.setTextColor(81, 33, 122);
            doc.setFontSize(14);
            doc.text('Detalles del evento', 30, 52);
            
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(12);
            doc.text(`Evento:`, 30, 62);
            doc.text(`${entradaInfo.eventoId?.nombre || evento || "-"}`, 70, 62);
            
            doc.text(`Discoteca:`, 30, 70);
            doc.text(`${entradaInfo.eventoId?.clubId?.nombre || "-"}`, 70, 70);
            
            doc.text(`Fecha:`, 30, 78);
            const fechaEvento = entradaInfo.eventoId?.fecha ? new Date(entradaInfo.eventoId.fecha) : null;
            const fechaFormatted = fechaEvento ? fechaEvento.toLocaleDateString() : "-";
            doc.text(fechaFormatted, 70, 78);
            
            doc.text(`Hora:`, 30, 86);
            const horaFormatted = fechaEvento ? fechaEvento.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "-";
            doc.text(horaFormatted, 70, 86);
            
            doc.text(`Ubicación:`, 30, 94);
            doc.text(`${entradaInfo.eventoId?.clubId?.ubicacion || "-"}`, 70, 94);
            
            doc.setFillColor(240, 240, 250);
            doc.rect(20, 105, 170, 10, 'F');
            doc.setTextColor(81, 33, 122);
            doc.setFontSize(14);
            doc.text('Detalles de la entrada', 30, 112);
            
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(12);
            doc.text(`Tipo:`, 30, 122);
            doc.text(`${entradaInfo.tipoEntrada || "General"}`, 70, 122);
            
            doc.text(`Precio:`, 30, 130);
            doc.text(`${entradaInfo.precioPagado || "10"} €`, 70, 130);
            
            doc.setFillColor(240, 240, 250);
            doc.rect(20, 140, 170, 10, 'F');
            doc.setTextColor(81, 33, 122);
            doc.setFontSize(14);
            doc.text('Información del asistente', 30, 147);
            
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(12);
            doc.text(`Nombre:`, 30, 157);
            doc.text(`${user.nombre || "-"}`, 70, 157);
            
            doc.text(`DNI:`, 30, 165);
            doc.text(`${user.dni || "-"}`, 70, 165);
            
            doc.text(`Edad:`, 30, 173);
            doc.text(`-`, 70, 173);
            
            try {
                const qrDataUrl = await QRCodeGen.toDataURL(entradaInfo._id);
                doc.addImage(qrDataUrl, 'PNG', 130, 145, 50, 50);
                
                doc.setTextColor(100, 100, 100);
                doc.setFontSize(8);
                doc.text('Escanea este código para validar tu entrada en el evento', 155, 200, { align: 'center' });
                doc.text(`ID: ${entradaInfo._id}`, 155, 205, { align: 'center' });
            } catch (qrError) {
            }
            
            doc.save(`entrada_${entradaInfo._id}.pdf`);
        } catch (error) {
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-900 via-gray-900 to-black flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl shadow-2xl text-center">                
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-4">¡Pago realizado con éxito!</h1>
                    <div className="h-1 w-32 mx-auto bg-fuchsia-500 mb-6"></div>
                    <p className="text-xl text-gray-300 mb-6">
                        Tu compra se ha completado correctamente. Aquí tienes tu entrada:
                    </p>
                    <p className="text-gray-400 text-sm">
                        Serás redirigido a tu dashboard en 30 segundos...
                    </p>
                </div>
                  {loading ? (
                    <div className="flex flex-col items-center justify-center h-64">
                        <div className="w-16 h-16 border-t-4 border-fuchsia-500 border-solid rounded-full animate-spin mb-6"></div>
                        <p className="text-gray-300 text-lg">Cargando detalles de tu entrada...</p>
                    </div>
                ) : entradaInfo ? (
                    <div className="bg-gray-800/70 rounded-xl p-8 mb-8 shadow-xl">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-gray-400 mb-1">Evento</h3>
                                <p className="text-white text-lg font-bold">{entradaInfo.eventoId?.nombre || evento || "No disponible"}</p>
                            </div>
                            <div>
                                <h3 className="text-gray-400 mb-1">Discoteca</h3>
                                <p className="text-white text-lg font-bold">{entradaInfo.eventoId?.clubId?.nombre || "No disponible"}</p>
                            </div>
                            <div>
                                <h3 className="text-gray-400 mb-1">Fecha</h3>
                                <p className="text-white text-lg font-bold">
                                    {entradaInfo.eventoId?.fecha ? new Date(entradaInfo.eventoId.fecha).toLocaleDateString() : "No disponible"}
                                </p>
                            </div>
                            <div>
                                <h3 className="text-gray-400 mb-1">Ubicación</h3>
                                <p className="text-white text-lg font-bold">{entradaInfo.eventoId?.clubId?.ubicacion || "No disponible"}</p>
                            </div>
                            <div>
                                <h3 className="text-gray-400 mb-1">Tipo de entrada</h3>
                                <p className="text-white text-lg font-bold">{entradaInfo.tipoEntrada || "General"}</p>
                            </div>
                            <div>
                                <h3 className="text-gray-400 mb-1">Precio</h3>
                                <p className="text-white text-lg font-bold">{entradaInfo.precioPagado || "10"} €</p>
                            </div>
                            <div>
                                <h3 className="text-gray-400 mb-1">Nombre</h3>
                                <p className="text-white text-lg font-bold">{user?.nombre || "No disponible"}</p>
                            </div>
                            <div>
                                <h3 className="text-gray-400 mb-1">DNI</h3>
                                <p className="text-white text-lg font-bold">{user?.dni || "No disponible"}</p>
                            </div>
                        </div>
                        
                        <div className="mt-8 flex flex-col items-center">
                            <p className="text-gray-400 mb-4">
                                Código QR para validar tu entrada
                            </p>
                            <div className="bg-white p-4 rounded-lg">
                                <QRCode value={entradaInfo._id || "123456"} size={180} />
                            </div>
                            <p className="text-gray-500 text-sm mt-2">
                                ID: {entradaInfo._id || "No disponible"}
                            </p>
                        </div>
                    </div>
                ) : null}                
                <div className="flex flex-col items-center justify-center mt-8 space-y-6">
                    <Button
                        onClick={descargarEntradaPDF}
                        className="w-64 bg-blue-700 hover:bg-blue-800 flex items-center justify-center gap-2"
                        disabled={!entradaInfo}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Descargar entrada (PDF)
                    </Button>
                    
                    <Button
                        onClick={() => navigate('/dashboard')}
                        className="w-64 bg-blue-700 hover:bg-blue-800"
                    >
                        Ir a mi perfil
                    </Button>
                </div>
            </div>
        </div>
    );
}