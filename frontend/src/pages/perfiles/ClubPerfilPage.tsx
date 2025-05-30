import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import EventoCard from "../../components/EventoCard";
import { useUserContext } from "../../context/userContext";
import PriceRangeIndicator from "../../components/PriceRangeIndicator";


export default function ClubPerfilPage() {
    const { id } = useParams();
    const [club, setClub] = useState<any>(null);
    const [eventos, setEventos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { user, api } = useUserContext();
    const navigate = useNavigate();
    const [pagina, setPagina] = useState(1);
    const elementosPorPagina = 20;

    useEffect(() => {
        const fetchClub = async () => {
            setLoading(true);
            try {
                // Usar el API de contexto para beneficiarse de tokens de autenticación si están disponibles
                const res = await api.get(`/clubs/${id}`);
                setClub(res.data);
                
                // Cargar eventos asociados al club
                try {
                    const eventosRes = await api.get(`/eventos/club/${id}`);
                    setEventos(eventosRes.data || []);
                } catch (error) {
                    console.error("Error al cargar eventos del club:", error);
                    setEventos([]);
                }
                
                setPagina(1); 
            } catch (error) {   
                console.error("Error al cargar información del club:", error);
                setClub(null);
                setEventos([]);
            } finally {
                setLoading(false);
            }
        };
        fetchClub();
    }, [id, api]);    async function manejarComprarEntrada(eventoId: string, tipoEntrada: string = "General") {
        try {
            const res = await api.post("/pagos/crear-sesion", { eventoId, tipoEntrada });
            window.location.href = res.data.url;
        } catch (error) {
            alert("Error al iniciar el pago. Vuelve a intentarlo más tarde.");
        }
    }// Paginación de eventos
    // Filtrar eventos para mostrar solo los que aún no han pasado (fecha >= hoy)
    const ahora = new Date();
    const eventosValidos = eventos.filter(e => e && e._id && e.nombre && e.fecha && new Date(e.fecha) >= ahora);
    const totalPaginas = Math.ceil(eventosValidos.length / elementosPorPagina);
    const eventosPaginados = eventosValidos.slice((pagina - 1) * elementosPorPagina, pagina * elementosPorPagina);
    
    return (
        <div className="min-h-screen bg-gradient-to-b from-black to-[#0c0815] text-white">
            <div className="relative py-16 px-4 overflow-hidden">
                {/* Elementos decorativos de fondo */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-gradient-to-br from-fuchsia-900/20 to-transparent blur-3xl"></div>
                    <div className="absolute top-1/2 right-0 w-80 h-80 rounded-full bg-gradient-to-bl from-purple-900/20 to-transparent blur-3xl"></div>
                </div>
                
                <div className="container mx-auto max-w-5xl relative z-10">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
                            <div className="w-16 h-16 border-4 border-fuchsia-600 border-t-transparent rounded-full animate-spin mb-4 shadow-lg shadow-fuchsia-600/30"></div>
                            <p className="text-fuchsia-300 font-medium text-lg tracking-wide animate-pulse">Cargando información...</p>
                        </div>
                    ) : !club ? (
                        <div className="text-center py-12 px-4 bg-[#121930]/50 rounded-xl border border-fuchsia-900/30 backdrop-blur-sm">
                            <h3 className="text-xl font-medium text-fuchsia-300 mb-2">Club no encontrado</h3>
                            <p className="text-gray-400">No pudimos encontrar la información de este club.</p>
                        </div>
                    ) : (
                        <>
                            {/* Perfil del Club */}
                            <div className="bg-gradient-to-br from-[#121930] to-[#1a1336] rounded-xl shadow-xl p-6 mb-10 border border-fuchsia-900/20 backdrop-blur-sm">
                                <div className="flex flex-col md:flex-row items-center gap-8">
                                    <div className="w-48 h-48 rounded-full border-4 border-fuchsia-700/50 shadow-lg shadow-fuchsia-800/20 overflow-hidden relative flex-shrink-0">
                                        <img
                                            src={club.fotoPerfil || club.fotoPerfilUrl || "/user-dark.svg"}
                                            alt={`Foto de perfil de ${club.nombre}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    
                                    <div className="flex-1">
                                        <h1 className="text-3xl font-bold mb-3 neon-fuchsia font-display">{club.nombre}</h1>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 mb-4">                                            <div className="flex items-center gap-2 text-gray-200">
                                                <div className="bg-fuchsia-900/30 p-2 rounded-full">
                                                    <svg className="w-4 h-4 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                                </div>                                                <div>
                                                    <span>{club.ubicacion || 'Sin ubicación'}</span>
                                                    <span className="text-gray-400 block text-sm ml-1">
                                                        {club.direccion || 'Ubicación exacta desconocida'}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            {club.telefono && (
                                                <div className="flex items-center gap-2 text-gray-200">
                                                    <div className="bg-fuchsia-900/30 p-2 rounded-full">
                                                        <svg className="w-4 h-4 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                                                    </div>
                                                    <span>{club.telefono}</span>
                                                </div>
                                            )}
                                            
                                            {club.email && (
                                                <div className="flex items-center gap-2 text-gray-200">
                                                    <div className="bg-fuchsia-900/30 p-2 rounded-full">
                                                        <svg className="w-4 h-4 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                                                    </div>
                                                    <span>{club.email}</span>
                                                </div>
                                            )}
                                              {/* Rango de precios */}
                                            {(club.priceRangeCalculated || club.priceRangeInitial) && (
                                                <div className="flex items-center gap-2 text-gray-200">
                                                    <div className="bg-fuchsia-900/30 p-2 rounded-full">
                                                        <svg className="w-4 h-4 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <PriceRangeIndicator 
                                                            priceRange={club.priceRangeCalculated || club.priceRangeInitial}
                                                            verified={!!club.priceRangeVerified}
                                                            size="md"
                                                        />
                                                        <span className="text-xs text-gray-400 mt-1">
                                                            {club.priceRangeVerified ? "Verificado automáticamente" : "Establecido por el propietario"}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {/* Capacidad */}
                                            {club.capacidad && (
                                                <div className="flex items-center gap-2 text-gray-200">
                                                    <div className="bg-fuchsia-900/30 p-2 rounded-full">
                                                        <svg className="w-4 h-4 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                                                    </div>
                                                    <span>
                                                        Capacidad: {club.capacidad} personas
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                          {/* Valoraciones */}
                                        {typeof club.media === 'number' && (
                                            <div className="inline-flex items-center gap-2 mb-4 bg-fuchsia-900/20 px-4 py-2 rounded-lg">
                                                <div className="flex">
                                                    {[1, 2, 3, 4, 5].map(i => (
                                                        <svg key={i} className={`w-5 h-5 ${i <= Math.round(club.media) ? "text-fuchsia-400" : "text-gray-500"}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path></svg>
                                                    ))}
                                                </div>
                                                <span className="text-sm text-fuchsia-200 font-medium">{club.media.toFixed(1)}</span>
                                                <span className="text-xs text-gray-300">({club.total || 0} reseñas)</span>
                                            </div>
                                        )}
                                        
                                        {/* Enlaces web y redes sociales */}
                                        <div className="flex gap-3 mb-4 flex-wrap">
                                            {club.web && (
                                                <a 
                                                    href={club.web} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-fuchsia-900/30 rounded-full border border-fuchsia-700/30 hover:bg-fuchsia-800/40 transition-colors text-sm"
                                                >
                                                    <svg className="w-4 h-4 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>
                                                    Página Web
                                                </a>
                                            )}
                                            
                                            {club.instagram && (
                                                <a 
                                                    href={club.instagram} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-fuchsia-900/30 rounded-full border border-fuchsia-700/30 hover:bg-fuchsia-800/40 transition-colors text-sm"
                                                >
                                                    <svg className="w-4 h-4 text-fuchsia-400" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153.509.5.902 1.105 1.153 1.772.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 01-1.153 1.772c-.5.509-1.105.902-1.772 1.153-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 01-1.772-1.153 4.904 4.904 0 01-1.153-1.772c-.247-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 011.153-1.772A4.897 4.897 0 015.45 2.525c.638-.247 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 1.802c-2.67 0-2.986.01-4.04.059-.976.045-1.505.207-1.858.344-.466.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.055-.059 1.37-.059 4.04 0 2.67.01 2.986.059 4.04.045.976.207 1.505.344 1.858.182.466.398.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.047 1.37.059 4.04.059 2.67 0 2.986-.01 4.04-.059.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.047-1.055.059-1.37.059-4.04 0-2.67-.01-2.986-.059-4.04-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.055-.047-1.37-.059-4.04-.059zm0 3.063a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 8.468a3.333 3.333 0 100-6.666 3.333 3.333 0 000 6.666zm6.538-8.469a1.2 1.2 0 11-2.4 0 1.2 1.2 0 012.4 0z" fillRule="evenodd" clipRule="evenodd"></path></svg>
                                                    Instagram
                                                </a>
                                            )}
                                        </div>
                                        
                                        {/* Géneros musicales */}
                                        {club.gustosMusicales && club.gustosMusicales.length > 0 && (
                                            <div className="mb-5">
                                                <h3 className="text-sm font-semibold text-fuchsia-200 mb-2">Géneros musicales</h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {club.gustosMusicales.map((genero: string, index: number) => (
                                                        <span 
                                                            key={index}
                                                            className="text-sm bg-fuchsia-900/40 text-fuchsia-300 px-3 py-1 rounded-full border border-fuchsia-700/30 hover:bg-fuchsia-700/50 hover:border-fuchsia-500/50 hover:text-white hover:shadow-sm hover:shadow-fuchsia-500/20 transition-all duration-300"
                                                        >
                                                            {genero}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Descripción */}
                                        {club.descripcion && (
                                            <div className="bg-[#0f1124]/50 rounded-lg p-4 border border-fuchsia-900/20">
                                                <p className="text-gray-300 text-sm leading-relaxed">{club.descripcion}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Sección de eventos */}
                            <div className="mt-8 mb-12">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold font-display text-white">Próximos eventos</h2>
                                    <div className="w-32 h-1 bg-gradient-to-r from-fuchsia-500 to-purple-800"></div>
                                </div>
                                
                                {loading ? (
                                    <div className="flex items-center justify-center py-10">
                                        <div className="w-10 h-10 border-2 border-fuchsia-600 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                ) : eventosValidos.length === 0 ? (
                                    <div className="text-center py-10 px-4 bg-[#121930]/50 rounded-xl border border-fuchsia-900/30 backdrop-blur-sm">
                                        <svg className="w-12 h-12 mx-auto text-fuchsia-700/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                        <h3 className="text-xl font-medium text-fuchsia-300 mb-2">No hay eventos próximos</h3>
                                        <p className="text-gray-400">
                                            Este club no tiene eventos programados para las próximas fechas.
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex flex-col gap-8">
                                            {eventosPaginados.map((evento: any) => (
                                                <EventoCard
                                                    key={evento._id || evento.id || evento.nombre}
                                                    evento={evento}
                                                    isUserLogged={!!user}
                                                    onVerDetalles={() => navigate(`/eventos/${evento._id}`)}
                                                    onComprar={() => {                                                        if (!user) return window.location.href = "/login";
                                                        manejarComprarEntrada(evento._id, "General");
                                                    }}
                                                />
                                            ))}
                                        </div>
                                        
                                        {/* Paginación */}
                                        {totalPaginas > 1 && (
                                            <div className="flex justify-center mt-12 gap-4">
                                                <button 
                                                    onClick={() => setPagina(p => Math.max(1, p - 1))} 
                                                    disabled={pagina === 1} 
                                                    className="px-4 py-2 border border-fuchsia-700/50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-fuchsia-300 hover:bg-fuchsia-900/30 transition"
                                                >
                                                    Anterior
                                                </button>
                                                
                                                <span className="flex items-center px-3 py-2 font-medium text-white">
                                                    Página {pagina} de {totalPaginas}
                                                </span>
                                                
                                                <button 
                                                    onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} 
                                                    disabled={pagina === totalPaginas} 
                                                    className="px-4 py-2 border border-fuchsia-700/50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-fuchsia-300 hover:bg-fuchsia-900/30 transition"
                                                >
                                                    Siguiente
                                                </button>
                                            </div>
                                        )}
                                    </>                                )}                            </div>
                        </>
                    )}
                </div>            </div>
            
            {/* Espaciador para evitar que el footer se pegue al contenido */}
            <div className="pb-10"></div>
        </div>
    );
}
