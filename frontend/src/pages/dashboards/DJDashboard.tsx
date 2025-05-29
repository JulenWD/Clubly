import { useEffect, useState, useRef } from "react";
import { Button } from "../../components/Button";
import { useUserContext } from "../../context/userContext";
import { Star, CheckCircle } from "lucide-react";

const EditarDJModal = ({ open, onClose, dj, onUpdated }: any) => {
    const { api, setUser, user } = useUserContext();
    const [nombre, setNombre] = useState(dj?.nombre || "");
    const [bio, setBio] = useState(dj?.bio || "");
    const [generos, setGeneros] = useState(dj?.generos || []);
    const [avatarUrl, setAvatarUrl] = useState(dj?.avatarUrl || "");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    if (!open) return null;
    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await api.put(`/djs/${dj._id}`, { nombre, bio, generos, avatarUrl });
            if (user && user.uid === dj.uid) {
                const res = await api.get(`/djs/mi-perfil`);
                setUser({
                    ...user,
                    fotoPerfilUrl: res.data.avatarUrl || user.fotoPerfilUrl || ""
                });
            }
            onUpdated();
            onClose();
        } catch (err: any) {
            setError("Error al actualizar el perfil");
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-auto">
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-full max-w-md border">
                <h2 className="text-xl font-bold mb-4">Editar perfil DJ</h2>
                <input className="w-full mb-2 p-2 border rounded" placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} required />
                <input className="w-full mb-2 p-2 border rounded" placeholder="Avatar URL" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} />
                <textarea className="w-full mb-2 p-2 border rounded" placeholder="Biografía" value={bio} onChange={e => setBio(e.target.value)} />
                <input className="w-full mb-2 p-2 border rounded" placeholder="Géneros (separados por coma)" value={generos.join(", ")} onChange={e => setGeneros(e.target.value.split(",").map((g: string) => g.trim()))} />
                {error && <p className="text-red-500 mb-2">{error}</p>}
                <div className="flex justify-end space-x-2">
                    <Button type="button" onClick={onClose} disabled={loading}>Cancelar</Button>
                    <Button type="submit" disabled={loading}>{loading ? "Guardando..." : "Guardar"}</Button>
                </div>
            </form>
        </div>
    );
};

export default function DJDashboard() {
    const { user, api } = useUserContext();
    const [dj, setDj] = useState<any>(null);
    const [eventos, setEventos] = useState<any[]>([]);
    const [media, setMedia] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);
    const [loading, setLoading] = useState(true);
    const [editModalOpen, setEditModalOpen] = useState(false);
    
    // Crear la referencia fuera del useEffect para mantener su valor entre renderizados
    const lastFetchTime = useRef(0);
    const minTimeBetweenFetches = 30000; // 30 segundos entre peticiones
    
    useEffect(() => {
        // Evitar peticiones innecesarias y limitar la frecuencia
        
        const fetchData = async () => {
            const now = Date.now();
            
            // Solo ejecutar la petición si ha pasado tiempo suficiente desde la última
            if (now - lastFetchTime.current < minTimeBetweenFetches && dj !== null) {
                setLoading(false);
                return;
            }
            
            lastFetchTime.current = now;
            
            try {
                const res = await api.get("/djs/mi-perfil");
                setDj(res.data);
                
                // Obtener el resto de datos solo si tenemos la información principal
                if (res.data && res.data._id) {
                    // Cargar eventos asociados al DJ
                    try {
                        const eventosRes = await api.get(`/eventos/dj/${res.data._id}`);
                        setEventos(eventosRes.data || []);
                    } catch (error) {
                        setEventos([]);
                    }
                    
                    // Cargar reseñas/puntuación
                    try {
                        const reviewsRes = await api.get(`/reviews/dj/${res.data._id}/media`);
                        setMedia(reviewsRes.data.media || 0);
                        setTotalReviews(reviewsRes.data.total || 0);
                    } catch (error) {
                        setMedia(0);
                        setTotalReviews(0);
                    }
                }
            } catch (err) {
                // No establecer DJ a null si ya tenemos datos previos
                if (dj === null) {
                    setDj(null);
                }
            } finally {
                setLoading(false);
            }
        };

        if (user && user.rol === "dj") {
            fetchData();
        } else {
            setLoading(false);
        }
    }, [user, api, dj]);

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
            {/* Header con elementos decorativos */}
            <div className="relative py-16 px-4 overflow-hidden">
                {/* Elementos decorativos de fondo */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-gradient-to-br from-fuchsia-900/20 to-transparent blur-3xl"></div>
                    <div className="absolute top-1/2 right-0 w-80 h-80 rounded-full bg-gradient-to-bl from-purple-900/20 to-transparent blur-3xl"></div>
                </div>
                
                <div className="container mx-auto max-w-5xl relative z-10">
                    <h1 className="text-4xl md:text-5xl font-bold text-center mb-3 neon-fuchsia font-display tracking-tight">
                        Panel de DJ
                    </h1>
                    <div className="w-24 h-1 bg-gradient-to-r from-fuchsia-500 to-purple-800 mx-auto mb-8"></div>

                    {dj ? (
                        <div className="bg-gradient-to-br from-[#121930] to-[#1a1336] rounded-xl shadow-xl p-6 border border-fuchsia-900/20 backdrop-blur-sm mb-10">
                            <div className="flex flex-col md:flex-row items-center gap-8">
                                <div className="w-36 h-36 rounded-full border-4 border-fuchsia-700/50 shadow-lg shadow-fuchsia-800/20 overflow-hidden relative flex-shrink-0">
                                    <img
                                        src={dj.fotoPerfil || user?.fotoPerfilUrl || "/default-profile.png"}
                                        alt="Foto de perfil DJ"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                
                                <div className="flex-1 text-center md:text-left">
                                    <h2 className="text-3xl font-bold mb-3 neon-fuchsia font-display flex items-center gap-2 justify-center md:justify-start">
                                        {dj.nombre}
                                        {dj.verificado && <CheckCircle className="text-fuchsia-500" size={24} />}
                                    </h2>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 mb-4">
                                        {dj.ubicacion && (
                                            <div className="flex items-center gap-2 text-gray-200 justify-center md:justify-start">
                                                <div className="bg-fuchsia-900/30 p-2 rounded-full">
                                                    <svg className="w-4 h-4 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                                </div>
                                                <span>{dj.ubicacion}</span>
                                            </div>
                                        )}
                                        
                                        <div className="flex items-center gap-2 justify-center md:justify-start">
                                            <div className="bg-fuchsia-900/30 rounded-full p-2">
                                                <Star size={16} className="text-fuchsia-400" />
                                            </div>
                                            <div className="flex items-center">
                                                {[1,2,3,4,5].map(i => (
                                                    <Star key={i} size={16} 
                                                        className={i <= Math.round(media) ? "text-fuchsia-400" : "text-gray-600"} 
                                                        fill={i <= Math.round(media) ? "#f0abfc" : "none"} 
                                                    />
                                                ))}
                                                <span className="text-sm text-gray-300 ml-2">{media.toFixed(1)} ({totalReviews})</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {dj.bio && (
                                        <p className="text-gray-300 mt-2">{dj.bio}</p>
                                    )}
                                    
                                    {dj.generos && dj.generos.length > 0 && (
                                        <div className="mt-4">
                                            <h3 className="text-sm font-medium text-gray-300 mb-2">Géneros musicales:</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {dj.generos.map((genero: string) => (
                                                    <span 
                                                        key={genero}
                                                        className="text-sm bg-fuchsia-900/40 text-fuchsia-300 px-3 py-1 rounded-full border border-fuchsia-700/30"
                                                    >
                                                        {genero}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div className="mt-6">
                                        <button 
                                            onClick={() => setEditModalOpen(true)} 
                                            className="bg-gradient-to-r from-fuchsia-600 to-purple-700 hover:from-fuchsia-500 hover:to-purple-600 py-2 px-4 rounded-lg text-white font-medium shadow-lg shadow-fuchsia-900/40 transition-all"
                                        >
                                            Editar perfil
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 px-4 bg-[#121930]/50 rounded-xl border border-fuchsia-900/30 backdrop-blur-sm">
                            <h3 className="text-xl font-medium text-fuchsia-300 mb-2">Perfil no encontrado</h3>
                            <p className="text-gray-400">No pudimos encontrar tu información de DJ.</p>
                        </div>
                    )}

                    <div className="mb-10">
                        <h2 className="text-2xl font-bold font-display neon-fuchsia mb-6">Próximos eventos</h2>
                        
                        {eventos.length > 0 ? (
                            <div className="grid gap-6">
                                {eventos.map((evento) => (
                                    <div key={evento._id} className="bg-gradient-to-br from-[#121930] to-[#1a1336] rounded-xl shadow-lg overflow-hidden border border-fuchsia-900/20 hover:shadow-xl hover:shadow-fuchsia-600/20 hover:border-fuchsia-500/30 hover:scale-[1.01] transition-all duration-300 ease-in-out transform">
                                        <div className="p-6">
                                            <h3 className="text-xl font-bold mb-2 text-white">{evento.nombre}</h3>
                                            <p className="text-gray-300 mb-1">{new Date(evento.fecha).toLocaleString()}</p>
                                            <p className="text-fuchsia-400 mb-3">
                                                Club: {evento.clubId?.nombre || 'Sin club'}
                                            </p>
                                            {evento.descripcion && <p className="text-gray-400 mb-4">{evento.descripcion}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16">
                                <div className="text-fuchsia-300/50 mb-4">
                                    <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                        <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zm7-10a1 1 0 01.707.293l.707.707L15 3.207A1 1 0 0116.414 4.5l-.707.707.707.707A1 1 0 0115 7.328l-.707-.707-1.414 1.414a1 1 0 11-1.414-1.414l1.414-1.414-.707-.707A1 1 0 0113.585 3l.708.707L15 2.293A1 1 0 0116.414 3.7l-1.414 1.414.707.707A1 1 0 0114.293 7l-.707-.707-.707.707a1 1 0 01-1.414 0l-.707-.707-.707.707a1 1 0 01-1.414-1.414l.707-.707-.707-.707a1 1 0 010-1.414l.707-.707-.707-.707A1 1 0 018.293 2l.707.707.707-.707z" clipRule="evenodd"></path>
                                    </svg>
                                </div>
                                <p className="text-lg text-gray-400">No tienes eventos programados</p>
                            </div>
                        )}
                    </div>

                    {!dj?.verificado && (
                        <div className="p-4 bg-[#121930]/80 rounded-xl border border-fuchsia-900/30 backdrop-blur-sm mb-8">
                            <h3 className="text-lg font-medium text-fuchsia-300 mb-2">Verificación pendiente</h3>
                            <p className="text-gray-400">
                                Tu cuenta de DJ está pendiente de verificación. Una vez verificada, podrás ser invitado a eventos por los clubs.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {dj && (
                <EditarDJModal 
                    open={editModalOpen} 
                    onClose={() => setEditModalOpen(false)} 
                    dj={dj}
                    onUpdated={() => {
                        setEditModalOpen(false);
                        // Recargar los datos
                        const fetchData = async () => {
                            try {
                                const res = await api.get("/djs/mi-perfil");
                                setDj(res.data);
                            } catch (err) {
                                console.error("Error al obtener perfil DJ:", err);
                            }
                        };
                        fetchData();
                    }}
                />
            )}
        </div>
    );
}
