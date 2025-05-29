import { useUserContext } from "../../context/userContext";
import authAxios from "../../helpers/authAxios";
import React, { useEffect } from "react";
import { ciudadesEspañolas } from "../../data/ciudades";
import { uploadImageToCloudinary } from "../../helpers/uploadImageToCloudinary";
import { auth } from "../../firebase.config";
import QRCode from "react-qr-code";
import { CheckCircle } from 'lucide-react';
import jsPDF from "jspdf";
import * as QRCodeGen from "qrcode";
// @ts-ignore
import StarRatings from 'react-star-ratings';
import RewardsSystem from '../../components/RewardsSystem';
import { generarMapaResenas, clubYaValorado, djYaValorado, marcarResenaEnviada } from '../../helpers/reviewHelpers';

const CLOUDINARY_PRESET = "Clubly";
const CLOUDINARY_CLOUDNAME = "clubly";

function normalizarId(id: any): string {
    if (!id) return '';
    
    try {
        if (typeof id === 'object') {
            if (id.$oid) {
                return id.$oid.toString().trim();
            }
            
            if (id._id) {
                if (id._id.$oid) {
                    return id._id.$oid.toString().trim();
                }
                
                const nestedId = id._id;
                
                if (typeof nestedId === 'string') {
                    return nestedId.trim();
                }
                
                if (typeof nestedId === 'object' && nestedId !== null) {
                    return nestedId.toString().trim();
                }
            }
            
            return id.toString().trim();
        }
          
        if (typeof id === 'string') {
            const idString = id.trim();
            if (idString.match(/ObjectId\(['"]?([0-9a-f]+)['"]?\)/i)) {
                return idString.replace(/^ObjectId\(['"]?([0-9a-f]+)['"]?\)$/i, '$1');
            }
            return idString;
        }
        
        return String(id).trim();
    } catch (error) {
        return '';
    }
}

function idsIguales(a: any, b: any): boolean {
    if (!a || !b) {
        return false;
    }
    
    try {
        if (a === b) {
            return true;
        }
        
        if (typeof a === 'object' && a.$oid && typeof b === 'object' && b.$oid) {
            return a.$oid === b.$oid;
        }
        
        if (typeof a === 'object' && a.$oid && typeof b === 'string') {
            return a.$oid === b;
        }
        
        if (typeof b === 'object' && b.$oid && typeof a === 'string') {
            return b.$oid === a;
        }
        
        const idA = normalizarId(a).trim();
        const idB = normalizarId(b).trim();
        
        if (!idA || !idB) {
            return false;
        }
        
        return idA === idB;
    } catch (error) {
        return false;
    }
}

const UserDashboard = () => {
    const { user, setUser } = useUserContext();
    const [fotoUrl, setFotoUrl] = React.useState("");
    const [fotoFile, setFotoFile] = React.useState<File | null>(null);
    const [ciudadSeleccionada, setCiudadSeleccionada] = React.useState<string>(user?.ciudad || "");
    const [entradas, setEntradas] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [, setError] = React.useState("");
    const [eventosAsistidos, setEventosAsistidos] = React.useState<any[]>([]);
    const [fotoLoading, setFotoLoading] = React.useState(false);
    const [actualizandoCiudad, setActualizandoCiudad] = React.useState(false);
    const [entradasPage, setEntradasPage] = React.useState(0);
    const [asistidosPage, setAsistidosPage] = React.useState(0);
    const [reviewPendiente, setReviewPendiente] = React.useState<any|null>(null);
    const [reviewData, setReviewData] = React.useState<{puntuacion:number,comentario:string}>({puntuacion:0,comentario:''});
    const [reviewError, setReviewError] = React.useState("");
    const [showNotVerified, setShowNotVerified] = React.useState(false);
    const [misReviews, setMisReviews] = React.useState<any[]>([]);
    const [reviewsCache, setReviewsCache] = React.useState<{
        [key: string]: boolean
    }>({});
    
    const ENTRADAS_POR_PAGINA = 4;
    
    const [progreso, setProgreso] = React.useState<{
        progreso:number, 
        total:number, 
        detalles:any[],
        progresosPorRango: {
            [key: string]: {
                progreso: number,
                rewards: Array<{
                    threshold: number,
                    type: string
                }>
            }
        }
    }>({
        progreso:0,
        total:10,
        detalles:[],
        progresosPorRango: {
            '$': { 
                progreso: 0, 
                rewards: [
                    { threshold: 10, type: 'consumicion' }, 
                    { threshold: 30, type: 'entrada_gratis' }, 
                    { threshold: 50, type: 'entrada_vip' }, 
                    { threshold: 100, type: 'mesa_vip' }
                ]
            },
            '$$': { 
                progreso: 0,
                rewards: [
                    { threshold: 10, type: 'consumicion' }, 
                    { threshold: 30, type: 'entrada_gratis' }, 
                    { threshold: 50, type: 'entrada_vip' }, 
                    { threshold: 100, type: 'mesa_vip' }
                ]
            },
            '$$$': { 
                progreso: 0, 
                rewards: [
                    { threshold: 10, type: 'consumicion' }, 
                    { threshold: 30, type: 'entrada_gratis' }, 
                    { threshold: 50, type: 'entrada_vip' }, 
                    { threshold: 100, type: 'mesa_vip' }
                ]
            },
            '$$$$': { 
                progreso: 0, 
                rewards: [
                    { threshold: 10, type: 'consumicion' }, 
                    { threshold: 30, type: 'entrada_gratis' }, 
                    { threshold: 50, type: 'entrada_vip' }, 
                    { threshold: 100, type: 'mesa_vip' }
                ]
            }
        }    
    });
    
    // Estado para recompensas reclamadas
    const [recompensasReclamadas, setRecompensasReclamadas] = React.useState<Record<string, boolean>>({
        '$': localStorage.getItem(`recompensa_reclamada_${user?.uid}_$`) === 'true',
        '$$': localStorage.getItem(`recompensa_reclamada_${user?.uid}_$$`) === 'true',
        '$$$': localStorage.getItem(`recompensa_reclamada_${user?.uid}_$$$`) === 'true',
        '$$$$': localStorage.getItem(`recompensa_reclamada_${user?.uid}_$$$$`) === 'true',
    });
      const obtenerResenas = async () => {
        try {
            if (!user || !user.uid) {
                return;
            }
            const res = await authAxios.get('/reviews/mis-resenyas');
            
            if (!res || !res.data) {
                setMisReviews([]);
                return;
            }
            
            const currentCache = {...reviewsCache};              if (res.data && Array.isArray(res.data)) {
                const reviewsProcesadas = res.data.map((r: any) => {
                    if (!r || typeof r !== 'object') {
                        return null;
                    }
                    
                    try {
                        const reviewId = r._id?.$oid || r._id?.toString() || "";
                        const rawEventoId = r.eventoId?.$oid || r.eventoId?._id?.$oid || r.eventoId?._id?.toString() || r.eventoId?.toString() || "";
                        const rawDestinoId = r.destinoId?.$oid || r.destinoId?._id?.$oid || r.destinoId?._id?.toString() || r.destinoId?.toString() || "";
                        
                        const normEventoId = normalizarId(r.eventoId || "");
                        const normDestinoId = normalizarId(r.destinoId || "");
                        
                        let tipoDestino = r.tipoDestino;
                        if (tipoDestino && typeof tipoDestino === 'string') {
                            tipoDestino = tipoDestino.trim();
                            if (tipoDestino.toLowerCase() === 'club') {
                                tipoDestino = 'Club'; // Formato exacto esperado
                            } else if (tipoDestino.toLowerCase() === 'dj') {
                                tipoDestino = 'DJ'; // Formato exacto esperado
                            }
                        }
                        
                        const reviewProcesada = {
                            ...r,
                            _id: reviewId,
                            eventoId: r.eventoId,
                            eventoIdRaw: rawEventoId,
                            eventoIdNorm: normEventoId,
                            destinoId: r.destinoId,
                            destinoIdRaw: rawDestinoId,
                            destinoIdNorm: normDestinoId,
                            tipoDestino: tipoDestino || null
                        };
                        
                        // Actualizar el cache con esta reseña encontrada
                        if (rawEventoId && rawDestinoId && tipoDestino) {
                            // Cache para club
                            if (tipoDestino === 'Club') {
                                const clubCacheKey = `club-${rawEventoId}-${rawDestinoId}`;
                                currentCache[clubCacheKey] = true;
                            }
                            // Cache para DJ
                            else if (tipoDestino === 'DJ') {
                                const djCacheKey = `dj-${rawEventoId}`;
                                currentCache[djCacheKey] = true;
                            }
                        }
                        
                        return reviewProcesada;
                    } catch (err) {
                        return null;
                    }
                }).filter(r => r !== null);
                
                setMisReviews(reviewsProcesadas);
                setReviewsCache(currentCache);
            } else {
                setMisReviews([]);
            }
        } catch (error) {
            setMisReviews([]);
        }
    };
      const obtenerProgreso = async () => {
        try {
            if (!user?.uid) return;
              const res = await authAxios.get(`/clubs/progreso-resenyas/${user?.uid}`);
            
            // Check if response contains expected data structure
            if (!res.data || typeof res.data !== 'object') {
                return;
            }
            
            // Set the progress state with the response data
            setProgreso(res.data);
            
            // Check if rewards are claimable for any price range and update state
            const newRecompensasReclamadas = { ...recompensasReclamadas };
              // Check each price range if there's any reward to claim
            for (const rango of ['$', '$$', '$$$', '$$$$']) {
                const yaReclamado = localStorage.getItem(`recompensa_reclamada_${user?.uid}_${rango}`) === 'true';
                
                // Update the claimed status
                newRecompensasReclamadas[rango] = yaReclamado;
                // Nota: Si necesitamos usar el progreso por rango más adelante, podemos usar:
                // const rangoProgress = res.data.progresosPorRango?.[rango]?.progreso || 0;
            }
            
            setRecompensasReclamadas(newRecompensasReclamadas);
            
        } catch (error) {
            // Error handling
        }
    };
      const obtenerEventosAsistidos = async () => {
        try {
            const res = await authAxios.get('/entradas/mis-entradas');
            const ahora = new Date();            
            const asistidos = res.data.filter((e:any) => new Date(e.eventoId?.fecha) < ahora);
            setEventosAsistidos(asistidos);
        } catch (error) {
            // Error handling
        }
    };
      const inicializarCacheResenas = () => {
        try {
            const reseñaEnviada = sessionStorage.getItem('clubly_review_submitted') === 'true';
            const manualCache: {[key: string]: boolean} = {};
            
            if (reseñaEnviada) {
                const tipoDestino = sessionStorage.getItem('clubly_review_submitted_tipo') || '';
                const eventoId = sessionStorage.getItem('clubly_review_submitted_evento') || '';
                const destinoId = sessionStorage.getItem('clubly_review_submitted_destino') || '';
                if (tipoDestino && eventoId) {
                    if (tipoDestino.toLowerCase() === 'club' && destinoId) {
                        const mainKey = `club-${eventoId}-${destinoId}`;
                        manualCache[mainKey] = true;
                        manualCache[`club${eventoId}${destinoId}`] = true;
                    } 
                    else if (tipoDestino.toLowerCase() === 'dj') {
                        const simpleKey = `dj-${eventoId}`;
                        manualCache[simpleKey] = true;
                        manualCache[`dj${eventoId}`] = true;
                        
                        if (destinoId) {
                            const fullKey = `dj-${eventoId}-${destinoId}`;
                            manualCache[fullKey] = true;
                            manualCache[`dj${eventoId}${destinoId}`] = true;
                        }
                    }
                    
                    try {
                        const eventosAlt = sessionStorage.getItem('clubly_review_submitted_evento_alt');
                        const destinosAlt = sessionStorage.getItem('clubly_review_submitted_destino_alt');
                        
                        if (eventosAlt) {
                            const eventosIds = JSON.parse(eventosAlt);
                            if (Array.isArray(eventosIds) && tipoDestino.toLowerCase() === 'dj') {
                                eventosIds.forEach(eId => {
                                    manualCache[`dj-${eId}`] = true;
                                    if (destinoId) {
                                        manualCache[`dj-${eId}-${destinoId}`] = true;
                                    }
                                });
                            } else if (Array.isArray(eventosIds) && destinosAlt && tipoDestino.toLowerCase() === 'club') {
                                const destinosIds = JSON.parse(destinosAlt);
                                if (Array.isArray(destinosIds)) {
                                    eventosIds.forEach(eId => {
                                        destinosIds.forEach(dId => {
                                            manualCache[`club-${eId}-${dId}`] = true;
                                        });
                                    });
                                }
                            }
                        }
                    } catch (jsonError) {
                        // Error handling
                    }
                }
            }
            
            let newCache = generarMapaResenas(misReviews);
            
            setReviewsCache(prevCache => {
                const combinedCache = { ...prevCache, ...newCache, ...manualCache };
                return combinedCache;
            });
        } catch (error) {
            // Error handling
        }
    };
    
    useEffect(() => {
        if (!user) return;
        
        const isPagoCompletado = sessionStorage.getItem('clubly_pago_completado') === 'true';
        const forceRefresh = sessionStorage.getItem('clubly_force_refresh') === 'true';
        
        const fetchEntradas = async () => {
            try {
                if (isPagoCompletado || forceRefresh) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                
                const res = await authAxios.get("/entradas/mis-entradas");
                setEntradas(res.data);
                  if (isPagoCompletado) {
                    // Limpiar flag de pago completado ya que ahora estamos en el dashboard
                    sessionStorage.removeItem('clubly_pago_completado');
                }
                
                if (forceRefresh) {
                    sessionStorage.removeItem('clubly_force_refresh');
                }
            } catch (err) {
                setError("No se pudieron cargar las entradas");
            } finally {
                setLoading(false);
            }
        };
        
        const inicializarDatos = async () => {
            try {
                const reseñaEnviada = sessionStorage.getItem('clubly_review_submitted') === 'true';
                if (reseñaEnviada) {
                    const tipoDestino = sessionStorage.getItem('clubly_review_submitted_tipo') || '';
                    const eventoId = sessionStorage.getItem('clubly_review_submitted_evento') || '';                    
                    const destinoId = sessionStorage.getItem('clubly_review_submitted_destino') || '';
                    
                    const newCache = {...reviewsCache};
                    
                    if (tipoDestino.toLowerCase() === 'club' && eventoId && destinoId) {
                        const cacheKey = `club-${eventoId}-${destinoId}`;
                        newCache[cacheKey] = true;
                    } 
                    else if (tipoDestino.toLowerCase() === 'dj' && eventoId) {
                        const cacheKey = `dj-${eventoId}`;
                        newCache[cacheKey] = true;
                        
                        if (destinoId) {
                            const fullCacheKey = `dj-${eventoId}-${destinoId}`;
                            newCache[fullCacheKey] = true;
                        }
                    }
                    
                    setReviewsCache(newCache);
                }                  await obtenerResenas();
                inicializarCacheResenas();
                  // 3. Cargar eventos asistidos que utilizarán la información de reseñas
                await obtenerEventosAsistidos();
                  // 4. Cargar progreso de recompensas
                await obtenerProgreso();
                
                if (reseñaEnviada) {
                    const tipoSubmitted = sessionStorage.getItem('clubly_review_submitted_tipo') || '';
                    
                    if (tipoSubmitted.toLowerCase() === 'club') {
                        sessionStorage.setItem('club_review_timestamp', new Date().toISOString());
                    } else if (tipoSubmitted.toLowerCase() === 'dj') {
                        sessionStorage.setItem('dj_review_timestamp', new Date().toISOString());
                    }
                }
            } catch (error) {
                // Error handling
            }
        };
        
        fetchEntradas();
        inicializarDatos();
    }, [user]);    // useEffect para inicializar el cache cuando se cargan las reseñas
    useEffect(() => {
        inicializarCacheResenas();
    }, [misReviews]);    const manejarFotoPerfil = async (e: React.FormEvent) => {
        e.preventDefault();
        setFotoLoading(true);
        if (!user || !user.uid) {
            alert("Usuario no válido. Vuelve a iniciar sesión.");
            setFotoLoading(false);
            return;
        }
        let finalUrl = fotoUrl;
        try {
            if (fotoFile) {
                finalUrl = await uploadImageToCloudinary(fotoFile, CLOUDINARY_PRESET, CLOUDINARY_CLOUDNAME);
            } else if (fotoUrl && fotoUrl.startsWith("http")) {
                finalUrl = await uploadImageToCloudinary(fotoUrl, CLOUDINARY_PRESET, CLOUDINARY_CLOUDNAME);
            }
            await authAxios.put(`/Usuarios/me`, { fotoPerfil: finalUrl });
            const response = await authAxios.post('/auth/login', { idToken: await auth.currentUser?.getIdToken() });
            const perfil = response.data.perfil;
            setUser({
                ...perfil,
                fotoPerfilUrl: perfil.fotoPerfil || perfil.fotoPerfilUrl || ""
            });
            setFotoUrl("");
            setFotoFile(null);        } catch (error) {
            alert("Error al subir la imagen de perfil");
        } finally {
            setFotoLoading(false);
        }
    };
    
    const manejarActualizarCiudad = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !user.uid) {
            alert("Usuario no válido. Vuelve a iniciar sesión.");
            return;
        }
        if (!ciudadSeleccionada) {
            alert("Por favor, selecciona una ciudad");
            return;
        }
        
        setActualizandoCiudad(true);
        try {
            await authAxios.put(`/usuarios/me`, { ubicacion: ciudadSeleccionada });
            localStorage.setItem('clubly_ciudad_usuario', ciudadSeleccionada);
            setUser(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    ciudad: ciudadSeleccionada
                };
            });            
            alert("Ciudad actualizada correctamente");
        } catch (error) {
            alert("Error al actualizar la ciudad.");
        } finally {
            setActualizandoCiudad(false);
        }
    };

    const manejarDescargarPDF = async (entrada: any) => {
        if (!entrada || !user) return;
        
        try {
            const doc = new jsPDF();
            
            // Header con estilo Clubly
            doc.setFillColor(81, 33, 122); // Morado de Clubly
            doc.rect(0, 0, 210, 20, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.text('CLUBLY', 105, 14, { align: 'center' });
            
            // Título
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(18);
            doc.text('Entrada para evento', 105, 35, { align: 'center' });
            
            doc.setDrawColor(81, 33, 122);
            doc.line(20, 40, 190, 40);
            
            // Sección de detalles del evento
            doc.setFillColor(240, 240, 250);
            doc.rect(20, 45, 170, 10, 'F');
            doc.setTextColor(81, 33, 122);
            doc.setFontSize(14);
            doc.text('Detalles del evento', 30, 52);
            
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(12);
            doc.text(`Evento:`, 30, 62);
            doc.text(`${entrada.eventoId?.nombre || "-"}`, 70, 62);
            
            doc.text(`Discoteca:`, 30, 70);
            doc.text(`${entrada.eventoId?.clubId?.nombre || "-"}`, 70, 70);
            
            doc.text(`Fecha:`, 30, 78);
            const fechaEvento = entrada.eventoId?.fecha ? new Date(entrada.eventoId.fecha) : null;
            const fechaFormatted = fechaEvento ? fechaEvento.toLocaleDateString() : "-";
            doc.text(fechaFormatted, 70, 78);
            
            doc.text(`Hora:`, 30, 86);
            const horaFormatted = fechaEvento ? fechaEvento.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "-";
            doc.text(horaFormatted, 70, 86);
            
            doc.text(`Ubicación:`, 30, 94);
            doc.text(`${entrada.eventoId?.clubId?.ubicacion || "-"}`, 70, 94);
            
            // Sección de detalles de la entrada
            doc.setFillColor(240, 240, 250);
            doc.rect(20, 105, 170, 10, 'F');
            doc.setTextColor(81, 33, 122);
            doc.setFontSize(14);
            doc.text('Detalles de la entrada', 30, 112);
            
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(12);
            doc.text(`Tipo:`, 30, 122);
            doc.text(`${entrada.tipoEntrada || "General"}`, 70, 122);
            
            doc.text(`Precio:`, 30, 130);
            doc.text(`${entrada.precioPagado || "10"} €`, 70, 130);
            
            // Sección de información del asistente
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
            
            // Añadir QR grande y centrado
            try {
                const qrDataUrl = await QRCodeGen.toDataURL(entrada._id);
                doc.addImage(qrDataUrl, 'PNG', 130, 145, 50, 50);
                
                // Pie de página
                doc.setTextColor(100, 100, 100);
                doc.setFontSize(8);
                doc.text('Escanea este código para validar tu entrada en el evento', 155, 200, { align: 'center' });
                doc.text(`ID: ${entrada._id}`, 155, 205, { align: 'center' });            } catch (qrError) {
                // Error handling for QR generation
            }
            
            doc.save(`entrada_${entrada._id}.pdf`);
        } catch (error) {
            // Error handling for PDF generation
        }
    };
    
    // Función para abrir el modal de reseña
    const manejarAbrirResena = (evento:any, tipoDestino:'club'|'dj', djId?: string) => {
        if (!user?.verificado) {
            setShowNotVerified(true);
            return;
        }
        
        // Si es una reseña para DJ y se proporciona un djId específico
        let destinoId;
        
        if (tipoDestino === 'dj' && djId) {
            // Usar ID directo para DJ específico
            destinoId = djId?.toString();
        } else if (tipoDestino === 'club') {
            // Obtener ID directo del club, sin normalización
            destinoId = evento.eventoId?.clubId?._id?.toString() || evento.eventoId?.clubId?.toString();
        } else {
            // Para DJ sin ID específico, tomar el primer DJ (directo)
            destinoId = evento.eventoId?.djIds?.length > 0 ? 
                (evento.eventoId.djIds[0]?._id?.toString() || evento.eventoId.djIds[0]?.toString()) : 
                null;
        }
        
        const eventoId = evento.eventoId?._id?.toString() || evento.eventoId?.toString();
        
        let reseñaExistente = false;
        
        reseñaExistente = misReviews.some((r: any) => {
            const reviewEventoId = r.eventoIdRaw || r.eventoId?._id?.toString() || r.eventoId?.toString();
            const reviewDestinoId = r.destinoIdRaw || r.destinoId?._id?.toString() || r.destinoId?.toString();
            const coincideTipo = r.tipoDestino === (tipoDestino === 'club' ? 'Club' : 'DJ');
            
            return reviewEventoId === eventoId && 
                   reviewDestinoId === destinoId && 
                   coincideTipo;
        });
        
        if (!reseñaExistente) {
            const eventoNormalizado = normalizarId(evento.eventoId);
            const destinoNormalizado = normalizarId(
                tipoDestino === 'club' 
                    ? evento.eventoId.clubId 
                    : (djId || (evento.eventoId.djIds?.length > 0 ? evento.eventoId.djIds[0] : null))
            );
            
            reseñaExistente = misReviews.some((r: any) => {
                const coincideEvento = idsIguales(r.eventoIdNorm || normalizarId(r.eventoId), eventoNormalizado);
                const coincideDestino = idsIguales(r.destinoIdNorm || normalizarId(r.destinoId), destinoNormalizado);
                const coincideTipo = r.tipoDestino === (tipoDestino === 'club' ? 'Club' : 'DJ');
                
                return coincideEvento && coincideDestino && coincideTipo;
            });
        }
          if (reseñaExistente) {
            setReviewError(`Ya has valorado este ${tipoDestino} para este evento.`);
            return;
        }
        
        // Si llegamos aquí, podemos continuar con la reseña
        setReviewPendiente({
            evento, 
            tipoDestino,
            destinoId, // Guardar el ID directo, sin normalizar
            multiplesDjs: tipoDestino === 'dj' && evento.eventoId.djIds?.length > 1 && !djId
        });
        setReviewData({puntuacion:0, comentario:''});
        setReviewError("");
    };
    
    // Función para enviar una reseña
    const manejarEnviarResena = async () => {
        if(!reviewPendiente) return;
        if(!user || !user.uid) {
            setReviewError("No se ha detectado un usuario válido. Por favor, vuelve a iniciar sesión.");
            return;
        }
        if(reviewData.puntuacion === 0) {
            setReviewError("Debes dar una puntuación");
            return;
        }
        
        // Para manejar el caso de múltiples DJs, aquí validamos si está seleccionado
        if (reviewPendiente.multiplesDjs && !reviewPendiente.djIdSeleccionado) {
            setReviewError("Por favor, selecciona un DJ para valorar");
            return;
        }
        
        // Usamos el destinoId que ya viene establecido en el reviewPendiente
        // o el que se seleccionó en el caso de múltiples DJs
        const destinoId = reviewPendiente.multiplesDjs 
            ? reviewPendiente.djIdSeleccionado 
            : reviewPendiente.destinoId;
            
        if (!destinoId) {
            setReviewError("No se pudo determinar el destinatario de la reseña");
            return;
        }
        
        try {
            const eventoId = reviewPendiente.evento.eventoId?._id?.toString() || reviewPendiente.evento.eventoId?.toString();
            
            const reviewBody = {
                usuarioUid: user.uid,
                destinoId: destinoId,
                tipoDestino: reviewPendiente.tipoDestino==='club'?'Club':'DJ',
                comentario: reviewData.comentario,
                puntuacion: reviewData.puntuacion,
                eventoId: eventoId
            };
              // Submit the review
            const response = await authAxios.post('/reviews', reviewBody);
              // Extraer el ID de la reseña de la respuesta (lo usaremos para la nueva reseña)
            const reviewId = response.data?._id || response.data?.id || response.data?.$oid || null;
              // Reset review form state
            setReviewPendiente(null);
            setReviewData({puntuacion:0,comentario:''});
            setReviewError("");
              // Crear la nueva reseña con los datos recibidos y procesarla igual que en fetchReviews
            const nuevaResena = {
                ...response.data,
                _id: reviewId || response.data?._id || "",
                eventoId: response.data?.eventoId || reviewBody.eventoId,
                eventoIdRaw: eventoId,
                eventoIdNorm: normalizarId(eventoId),
                destinoId: response.data?.destinoId || reviewBody.destinoId,
                destinoIdRaw: destinoId, 
                destinoIdNorm: normalizarId(destinoId),
                tipoDestino: reviewPendiente.tipoDestino === 'club' ? 'Club' : 'DJ'
            };
            
            // Agregar la nueva reseña al estado
            setMisReviews(prevReviews => [...prevReviews, nuevaResena]);
                
            const newCache = {...reviewsCache};
            
            const allEventoIds = [
                eventoId, 
                normalizarId(eventoId),
                reviewPendiente.evento?.eventoId?.$oid || 
                reviewPendiente.evento?.eventoId?._id?.$oid || 
                reviewPendiente.eventoId?.$oid || 
                reviewPendiente.eventoId?._id?.$oid || "",
                reviewPendiente.evento?.eventoId?.toString() || 
                reviewPendiente.eventoId?.toString() || ""
            ].filter(id => id && id.trim() !== '');
            
            const allDestinoIds = [
                destinoId,
                normalizarId(destinoId),
                reviewPendiente.destinoId?.$oid || 
                reviewPendiente.destinoId?._id?.$oid || "",
                // Cualquier otra variante que pueda existir
                reviewPendiente.destinoId?.toString() || ""
            ].filter(id => id && id.trim() !== ''); // Filtrar valores vacíos
            
            // Log para debugging
            if (reviewBody.tipoDestino === 'Club') {
                allEventoIds.forEach(eId => {
                    allDestinoIds.forEach(cId => {
                        const cacheKey = `club-${eId}-${cId}`;
                        newCache[cacheKey] = true;
                        
                        const altKey = `club${eId}${cId}`;
                        newCache[altKey] = true;
                        
                        const prefixKey = `club-${eId}`;
                        newCache[prefixKey] = true;
                    });
                });
            } else {
                // Formato simple (solo evento)
                allEventoIds.forEach(eId => {
                    const cacheKey = `dj-${eId}`;
                    newCache[cacheKey] = true;
                    
                    const altKey = `dj${eId}`;
                    newCache[altKey] = true;
                });
                
                // Formato completo (evento+dj)
                allEventoIds.forEach(eId => {
                    allDestinoIds.forEach(dId => {
                        const cacheKey = `dj-${eId}-${dId}`;
                        newCache[cacheKey] = true;
                        
                        const altKey = `dj${eId}${dId}`;
                        newCache[altKey] = true;
                    });
                });
            }
              // Actualizar el caché con todas las claves a la vez
            setReviewsCache(newCache);
            
            // Usar el helper para marcar la reseña como enviada con información completa
            // Esto permitirá reconstruir el caché correctamente en futuras cargas
            marcarResenaEnviada(
              reviewPendiente.tipoDestino,
              eventoId,
              destinoId
            );
            
            // SOLUCIÓN CRÍTICA: Forzar una actualización inmediata del cache para asegurar que los botones se actualicen
            // Después de crear todas las claves en el cache
            if (reviewBody.tipoDestino === 'Club') {
                // Guardar en sessionStorage una marca temporal para evitar parpadeos
                sessionStorage.setItem('club_review_timestamp', new Date().toISOString());
                
                // Forzar renderizado mediante una pequeña manipulación del estado
                setReviewsCache(prevCache => {
                    const forceUpdateCache = {...prevCache};
                    const updateKey = `force_update_${Math.random()}`;
                    forceUpdateCache[updateKey] = true;
                    return forceUpdateCache;
                });
            } else if (reviewBody.tipoDestino === 'DJ') {
                // Similar para DJ
                sessionStorage.setItem('dj_review_timestamp', new Date().toISOString());
                
                // Forzar renderizado
                setReviewsCache(prevCache => {
                    const forceUpdateCache = {...prevCache};
                    const updateKey = `force_update_${Math.random()}`;
                    forceUpdateCache[updateKey] = true;
                    return forceUpdateCache;
                });
            }

            // Mostrar notificación de éxito inmediatamente
            alert(`¡Reseña para ${reviewBody.tipoDestino === 'Club' ? 'el club' : 'el DJ'} enviada con éxito!`);
            
            // Intentar refrescar los datos en segundo plano
            try {                // Esperar un momento para asegurar que el backend procese los cambios
                await new Promise(resolve => setTimeout(resolve, 1000));
                  // Refresh rewards progress data first
                await obtenerProgreso();
                
                // Petición de datos actualizada preservando el caché
                await obtenerResenas();
                
                // Re-inicialización explícita del caché para mayor seguridad
                inicializarCacheResenas();
                
                // Re-fetch attended events to update buttons state
                await obtenerEventosAsistidos();} catch (refreshError) {
                // No mostramos alerta aquí porque la UI ya se actualizó localmente
            }
              } catch (err: any) {
            if (err.response?.data?.message) {
                // Mensaje específico del backend
                setReviewError(err.response.data.message);
            } else if (err.message) {
                // Mensaje general de error
                setReviewError(`Error: ${err.message}`);
            } else {
                // Error desconocido
                setReviewError("Error al enviar la reseña. Intenta de nuevo más tarde.");
            }
        }
    };
    
    // Calcular datos para paginar entradas y eventos asistidos
    const ahora = new Date();
    const entradasFuturas = entradas.filter(e => {
        const fechaEvento = new Date(e.eventoId?.fecha);
        return fechaEvento >= ahora || (ahora.getTime() - fechaEvento.getTime() < 24 * 60 * 60 * 1000);
    });
    
    const entradasFuturasPaginadas = entradasFuturas.slice(entradasPage * ENTRADAS_POR_PAGINA, (entradasPage + 1) * ENTRADAS_POR_PAGINA);
    const totalEntradasPages = Math.ceil(entradasFuturas.length / ENTRADAS_POR_PAGINA);

    const eventosAsistidosPaginados = eventosAsistidos.slice(asistidosPage * ENTRADAS_POR_PAGINA, (asistidosPage + 1) * ENTRADAS_POR_PAGINA);
    const totalAsistidosPages = Math.ceil(eventosAsistidos.length / ENTRADAS_POR_PAGINA);
    
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-black to-[#0c0815] text-white">
                <div className="container mx-auto py-16 px-4">
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-16 h-16 border-4 border-fuchsia-600 border-t-transparent rounded-full animate-spin mb-4 shadow-lg shadow-fuchsia-600/30"></div>
                        <p className="text-fuchsia-300 font-medium text-lg tracking-wide animate-pulse">Cargando información...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-black to-[#0c0815] text-white">
            <div className="relative py-16 px-4 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-gradient-to-br from-fuchsia-900/20 to-transparent blur-3xl"></div>
                    <div className="absolute top-1/2 right-0 w-80 h-80 rounded-full bg-gradient-to-bl from-purple-900/20 to-transparent blur-3xl"></div>
                </div>
                
                <div className="container mx-auto max-w-5xl relative z-10">
                    <h1 className="text-4xl md:text-5xl font-bold text-center mb-3 neon-fuchsia font-display tracking-tight">
                        Mi perfil
                    </h1>
                    <div className="w-24 h-1 bg-gradient-to-r from-fuchsia-500 to-purple-800 mx-auto mb-8"></div>
                    
                    <div className="bg-gradient-to-br from-[#121930] to-[#1a1336] rounded-xl shadow-xl p-6 border border-fuchsia-900/20 backdrop-blur-sm mb-10">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="w-36 h-36 rounded-full border-4 border-fuchsia-700/50 shadow-lg shadow-fuchsia-800/20 overflow-hidden relative flex-shrink-0">
                                <img
                                    src={user?.fotoPerfilUrl || "/default-profile.png"}
                                    alt="Foto de perfil"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            
                            <div className="flex-1 text-center md:text-left">
                                <h2 className="text-3xl font-bold mb-2 neon-fuchsia font-display">
                                    {user?.nombre || "Usuario"}
                                </h2>
                                <p className="text-gray-300 mb-4">{user?.email}</p>
                                
                                <form onSubmit={manejarFotoPerfil} className="mt-4 flex flex-col md:flex-row items-center gap-3">
                                    <div className="relative flex-1 w-full">
                                        <input 
                                            type="text" 
                                            placeholder="URL de imagen de perfil" 
                                            value={fotoUrl} 
                                            onChange={e => setFotoUrl(e.target.value)} 
                                            className="p-3 rounded-lg bg-[#0f1124] border border-fuchsia-900/30 text-white focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 transition-all w-full"
                                        />
                                    </div>
                                    <label className="bg-fuchsia-900/30 rounded-lg text-white p-2 px-4 cursor-pointer hover:bg-fuchsia-800/40 transition-all w-full md:w-auto text-center">
                                        <span>Seleccionar archivo</span>
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            onChange={e => setFotoFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)} 
                                            className="hidden"
                                        />
                                    </label>
                                    <button 
                                        type="submit" 
                                        className="bg-gradient-to-r from-fuchsia-600 to-purple-700 hover:from-fuchsia-500 hover:to-purple-600 py-2 px-4 rounded-lg text-white font-medium shadow-lg shadow-fuchsia-900/40 transition-all w-full md:w-auto disabled:opacity-50"
                                        disabled={fotoLoading}
                                    >
                                        {fotoLoading ? "Subiendo..." : "Actualizar foto"}
                                    </button>
                                </form>
                                {fotoFile && (
                                    <div className="mt-2 text-sm text-gray-400">
                                        Archivo seleccionado: {fotoFile.name}
                                    </div>
                                )}
                                <div className="mt-6">
                                    <label className="block text-fuchsia-300 mb-2">Selecciona tu ciudad</label>
                                    <select 
                                        value={ciudadSeleccionada} 
                                        onChange={e => setCiudadSeleccionada(e.target.value)} 
                                        className="p-3 rounded-lg bg-[#0f1124] border border-fuchsia-900/30 text-white focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 transition-all w-full"
                                    >
                                        <option value="">Selecciona una ciudad</option>
                                        {ciudadesEspañolas.map(ciudad => (
                                            <option key={ciudad} value={ciudad}>{ciudad}</option>
                                        ))}
                                    </select>
                                    <button 
                                        onClick={manejarActualizarCiudad}
                                        className="bg-gradient-to-r from-fuchsia-600 to-purple-700 hover:from-fuchsia-500 hover:to-purple-600 py-2 px-4 rounded-lg text-white font-medium shadow-lg shadow-fuchsia-900/40 transition-all mt-4 w-full md:w-auto disabled:opacity-50"
                                        disabled={actualizandoCiudad}
                                    >
                                        {actualizandoCiudad ? "Actualizando..." : "Actualizar ciudad"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Rewards System Component */}
                    <RewardsSystem progreso={progreso} />
                    
                    <div className="mb-10">
                        <h2 className="text-2xl font-bold font-display neon-fuchsia mb-6">Mis entradas</h2>
                        
                        {entradasFuturas.length > 0 ? (
                            <div className="grid gap-6 md:grid-cols-2">
                                {entradasFuturasPaginadas.map(entrada => (
                                    <div key={entrada._id} className="bg-gradient-to-br from-[#121930] to-[#1a1336] rounded-xl shadow-lg overflow-hidden border border-fuchsia-900/20 hover:shadow-xl hover:shadow-fuchsia-600/20 transition-all duration-300 ease-in-out">
                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="text-xl font-bold text-white mb-1">{entrada.eventoId?.nombre || "Evento sin nombre"}</h3>
                                                    <p className="text-gray-300">{new Date(entrada.eventoId?.fecha).toLocaleString()}</p>
                                                </div>
                                                <div className="bg-fuchsia-900/40 text-fuchsia-300 px-3 py-1 rounded-full text-sm font-medium">
                                                    {entrada.tipoEntrada}
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-2 mb-4">
                                                <div className="bg-fuchsia-900/30 p-2 rounded-full">
                                                    <svg className="w-4 h-4 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                                </div>
                                                <span className="text-gray-300">{entrada.eventoId?.clubId?.nombre || "Club no especificado"}</span>
                                            </div>
                                            
                                            <div className="bg-[#0f1124] p-4 rounded-lg mb-4 flex justify-center">
                                                <QRCode value={entrada._id} size={120} />
                                            </div>
                                            
                                            <div className="flex flex-wrap gap-3">
                                                <button 
                                                    onClick={() => manejarDescargarPDF(entrada)}
                                                    className="bg-fuchsia-900/40 text-fuchsia-300 hover:bg-fuchsia-800/60 hover:text-white transition-colors py-2 px-4 rounded-lg flex items-center gap-2 text-sm font-medium"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                                    Descargar PDF
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 px-4 bg-[#121930]/50 rounded-xl border border-fuchsia-900/30 backdrop-blur-sm">
                                <h3 className="text-xl font-medium text-fuchsia-300 mb-2">No tienes entradas</h3>
                                <p className="text-gray-400">No has comprado ninguna entrada para eventos próximos.</p>
                            </div>
                        )}
                        
                        {/* Paginación */}
                        {entradasFuturas.length > ENTRADAS_POR_PAGINA && (
                            <div className="flex justify-center gap-2 mt-6">
                                {[...Array(totalEntradasPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setEntradasPage(i)}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                            entradasPage === i 
                                                ? 'bg-fuchsia-600 text-white' 
                                                : 'bg-[#121930] text-gray-300 hover:bg-fuchsia-900/40'
                                        }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <div className="mb-10">
                        <h2 className="text-2xl font-bold font-display neon-fuchsia mb-6">Eventos asistidos</h2>
                        
                        {eventosAsistidos.length > 0 ? (
                            <div className="grid gap-6 md:grid-cols-2">
                                {eventosAsistidosPaginados.map(evento => (
                                    <div key={evento._id} className="bg-gradient-to-br from-[#121930] to-[#1a1336] rounded-xl shadow-lg overflow-hidden border border-fuchsia-900/20">
                                        <div className="p-6">
                                            <h3 className="text-xl font-bold text-white mb-1">{evento.eventoId?.nombre || "Evento sin nombre"}</h3>
                                            <p className="text-gray-300 mb-3">{new Date(evento.eventoId?.fecha).toLocaleString()}</p>
                                            
                                            <div className="flex gap-2 mb-4">
                                                <div className="bg-fuchsia-900/30 p-2 rounded-full">
                                                    <svg className="w-4 h-4 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                                </div>
                                                <span className="text-gray-300">{evento.eventoId?.clubId?.nombre || "Club no especificado"}</span>
                                            </div>
                                            
                                            <div className="flex flex-col gap-2 mt-4">
                                                {/* Botón para reseña del club */}
                                                {(() => {                                                    // Obtener IDs como strings para comparación
                                                    const eventoIdStr = evento.eventoId?._id?.toString() || evento.eventoId?.toString();
                                                    const clubIdStr = evento.eventoId?.clubId?._id?.toString() || evento.eventoId?.clubId?.toString();
                                                    
                                                    // Comprobar primero si hay un indicador en sessionStorage de reseña reciente 
                                                    // y si es para este evento y club en particular
                                                    const eventoSubmittedId = sessionStorage.getItem('clubly_review_submitted_evento');
                                                    const clubSubmittedId = sessionStorage.getItem('clubly_review_submitted_destino');
                                                    const tipoSubmitted = sessionStorage.getItem('clubly_review_submitted_tipo');
                                                    
                                                    // Verificación directa con sessionStorage (más inmediata)
                                                    let estaValoradoSession = false;
                                                    if (tipoSubmitted === 'club' && eventoSubmittedId && clubSubmittedId) {
                                                        // Comparar IDs sin normalizar primero para mayor rapidez
                                                        if ((eventoIdStr === eventoSubmittedId || eventoIdStr?.includes(eventoSubmittedId) || eventoSubmittedId?.includes(eventoIdStr)) && 
                                                            (clubIdStr === clubSubmittedId || clubIdStr?.includes(clubSubmittedId) || clubSubmittedId?.includes(clubIdStr))) {
                                                            estaValoradoSession = true;

                                                        }
                                                    }
                                                    
                                                    // Si no está en session, verificar con la función helper
                                                    const estaValoradoCache = clubYaValorado(
                                                        reviewsCache,
                                                        evento.eventoId,
                                                        evento.eventoId?.clubId
                                                    );
                                                    
                                                    // Combinar resultados
                                                    const estaValorado = estaValoradoSession || estaValoradoCache;
                                                    
                                                    // Log de diagnóstico
                                                    
                                                    // Renderizar componente según el resultado
                                                    if (estaValorado) {
                                                        return (
                                                            <div className="bg-[#0f1124] p-3 rounded-lg text-fuchsia-300 text-sm flex items-center gap-2">
                                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                                                Club valorado
                                                            </div>
                                                        );
                                                    } else {
                                                        return (
                                                            <button 
                                                                onClick={() => manejarAbrirResena(evento, 'club')}
                                                                className="bg-gradient-to-r from-fuchsia-600 to-purple-700 hover:from-fuchsia-500 hover:to-purple-600 py-2 px-4 rounded-lg text-white font-medium shadow-lg shadow-fuchsia-900/40 transition-all text-sm"
                                                            >
                                                                Valorar club
                                                            </button>
                                                        );
                                                    }
                                                })()}
                                                
                                                {/* Botón para reseña del DJ (solo si el evento tiene DJs) */}
                                                {evento.eventoId?.djIds && evento.eventoId.djIds.length > 0 && (
                                                    (() => {                                                        // Obtener ID del evento como string para comparación
                                                        const eventoIdStr = evento.eventoId?._id?.toString() || evento.eventoId?.toString();
                                                        
                                                        // Comprobar primero en sessionStorage
                                                        const eventoSubmittedId = sessionStorage.getItem('clubly_review_submitted_evento');
                                                        const tipoSubmitted = sessionStorage.getItem('clubly_review_submitted_tipo');
                                                        
                                                        // Verificación directa con sessionStorage
                                                        let estaValoradoSession = false;
                                                        if (tipoSubmitted === 'dj' && eventoSubmittedId) {
                                                            // Comparar IDs de evento
                                                            if (eventoIdStr === eventoSubmittedId || 
                                                                eventoIdStr?.includes(eventoSubmittedId) || 
                                                                eventoSubmittedId?.includes(eventoIdStr)) {
                                                                estaValoradoSession = true;
    
                                                            }
                                                        }
                                                        
                                                        // Si no está en session, verificar con la función helper
                                                        const estaValoradoCache = djYaValorado(
                                                            reviewsCache,
                                                            evento.eventoId
                                                            // No pasamos djId específico para verificar cualquier DJ del evento
                                                        );
                                                        
                                                        // Combinar resultados
                                                        const estaValorado = estaValoradoSession || estaValoradoCache;
                                                          // Verificar si DJ valorado
                                                        
                                                        // Renderizar componente según resultado
                                                        if (estaValorado) {
                                                            return (
                                                                <div className="bg-[#0f1124] p-3 rounded-lg text-indigo-300 text-sm flex items-center gap-2">
                                                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                                                    DJ valorado
                                                                </div>
                                                            );
                                                        } else {
                                                            return (
                                                                <button 
                                                                    onClick={() => manejarAbrirResena(evento, 'dj')}
                                                                    className="bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 py-2 px-4 rounded-lg text-white font-medium shadow-lg shadow-purple-900/40 transition-all text-sm"
                                                                >
                                                                    Valorar DJ
                                                                </button>
                                                            );
                                                        }
                                                    })()
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 px-4 bg-[#121930]/50 rounded-xl border border-fuchsia-900/30 backdrop-blur-sm">
                                <h3 className="text-xl font-medium text-fuchsia-300 mb-2">No has asistido a eventos</h3>
                                <p className="text-gray-400">Aún no has asistido a ningún evento con tu cuenta.</p>
                            </div>
                        )}
                        
                        {eventosAsistidos.length > ENTRADAS_POR_PAGINA && (
                            <div className="flex justify-center gap-2 mt-6">
                                {[...Array(totalAsistidosPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setAsistidosPage(i)}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                            asistidosPage === i 
                                                ? 'bg-fuchsia-600 text-white' 
                                                : 'bg-[#121930] text-gray-300 hover:bg-fuchsia-900/40'
                                        }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    {/* Review Modal */}
                    {reviewPendiente && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
                            <div className="bg-[#121930] border border-fuchsia-900/30 rounded-xl p-6 shadow-xl shadow-fuchsia-900/30 w-full max-w-md">
                                <h3 className="text-2xl font-bold text-white mb-4">
                                    Deja tu reseña para {reviewPendiente.tipoDestino === 'club' ? 'Club' : 'DJ'}
                                </h3>
                                
                                {reviewPendiente.tipoDestino === 'dj' && reviewPendiente.multiplesDjs && (
                                    <div className="mb-5">
                                        <label className="block text-fuchsia-300 mb-2">Selecciona el DJ que deseas valorar:</label>
                                        <select 
                                            className="p-3 rounded-lg bg-[#0f1124] border border-fuchsia-900/30 text-white focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 transition-all w-full"
                                            onChange={(e) => setReviewPendiente({
                                                ...reviewPendiente,
                                                djIdSeleccionado: e.target.value
                                            })}
                                            defaultValue=""
                                            required
                                        >
                                            <option value="" disabled>Selecciona un DJ</option>
                                            {reviewPendiente.evento.eventoId.djIds?.map((dj:any) => (
                                                <option key={dj._id} value={dj._id}>{dj.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                
                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    manejarEnviarResena();
                                }}>
                                    <div className="mb-4">
                                        <label className="block text-fuchsia-300 mb-2">Puntúa tu experiencia</label>
                                        <div className="flex justify-center">
                                            <StarRatings
                                                rating={reviewData.puntuacion}
                                                starRatedColor="#f0abfc"
                                                starHoverColor="#e879f9"
                                                changeRating={(newRating: number) => setReviewData({...reviewData, puntuacion: newRating})}
                                                numberOfStars={5}
                                                starDimension="30px"
                                                name='rating'
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="mb-4">
                                        <label className="block text-fuchsia-300 mb-2">Comentarios</label>
                                        <textarea 
                                            className="p-3 rounded-lg bg-[#0f1124] border border-fuchsia-900/30 text-white focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 transition-all w-full"
                                            placeholder="Comparte tu experiencia..."
                                            value={reviewData.comentario}
                                            onChange={e => setReviewData({...reviewData, comentario: e.target.value})}
                                            rows={4}
                                            required
                                        ></textarea>
                                    </div>
                                    
                                    {reviewError && (
                                        <div className="bg-red-900/30 border border-red-500/30 text-red-300 p-3 rounded-lg mb-4">
                                            <p className="text-sm">{reviewError}</p>
                                        </div>
                                    )}
                                    
                                    <div className="flex justify-end gap-3">
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                setReviewPendiente(null);
                                                setReviewData({puntuacion:0,comentario:''});
                                                setReviewError("");
                                            }}
                                            className="bg-gray-700 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button 
                                            type="submit"
                                            className="bg-gradient-to-r from-fuchsia-600 to-purple-700 hover:from-fuchsia-500 hover:to-purple-600 py-2 px-4 rounded-lg text-white font-medium shadow-lg shadow-fuchsia-900/40 transition-all"
                                            disabled={reviewData.puntuacion === 0 || reviewData.comentario.trim() === ''}
                                        >
                                            Enviar reseña
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                    
                    {/* Not verified modal */}
                    {showNotVerified && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
                            <div className="bg-[#121930] border border-fuchsia-900/30 rounded-xl p-6 shadow-xl shadow-fuchsia-900/30 w-full max-w-md">
                                <h3 className="text-2xl font-bold text-white mb-4">Cuenta no verificada</h3>
                                <p className="text-gray-300 mb-6">
                                    Tu cuenta no está verificada. Para poder asistir a eventos, debes verificar tu cuenta añadiendo tu DNI.
                                </p>
                                <div className="flex justify-end">
                                    <button 
                                        onClick={() => setShowNotVerified(false)}
                                        className="bg-gradient-to-r from-fuchsia-600 to-purple-700 hover:from-fuchsia-500 hover:to-purple-600 py-2 px-4 rounded-lg text-white font-medium shadow-lg shadow-fuchsia-900/40 transition-all"
                                    >
                                        Entendido
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;
