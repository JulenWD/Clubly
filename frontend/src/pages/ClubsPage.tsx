import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ClubCard from "../components/ClubCard";
import { useUserContext } from "../context/userContext";
import PriceRangeSelector from "../components/PriceRangeSelector";
import { PriceRange } from "../types/PriceRange";

export default function ClubsPage() {
    const [clubs, setClubs] = useState<any[]>([]);
    const [nombre, setNombre] = useState("");
    const [ubicacion, setUbicacion] = useState("");
    const [estilo, setEstilo] = useState("");
    const [selectedPriceRanges, setSelectedPriceRanges] = useState<PriceRange[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagina, setPagina] = useState(1);
    const [error, setError] = useState<string | null>(null);
    const elementosPorPagina = 20;
    const navigate = useNavigate();
    const { api } = useUserContext();

    useEffect(() => {
        fetchClubs();
    }, []);    
    const fetchClubs = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get("/clubs");
            setClubs(res.data || []);
        } catch (err) {
            console.error("Error al cargar clubs:", err);
            setError("No se pudieron cargar las discotecas. Por favor, intenta nuevamente más tarde.");
            setClubs([]);
        } finally {
            setTimeout(() => setLoading(false), 800);
        }
    };    
    useEffect(() => {
        setPagina(1);
    }, [nombre, ubicacion, estilo, selectedPriceRanges]);

    const filteredClubs = clubs.filter(club =>
        (!nombre || club.nombre.toLowerCase().includes(nombre.toLowerCase())) &&
        (!ubicacion || (club.ubicacion || "").toLowerCase().includes(ubicacion.toLowerCase())) &&
        (!estilo || (club.gustosMusicales || []).some((g: string) => g.toLowerCase().includes(estilo.toLowerCase()))) &&
        (selectedPriceRanges.length === 0 || selectedPriceRanges.includes(club.priceRange))
    );
    const totalPaginas = Math.ceil(filteredClubs.length / elementosPorPagina);
    const clubsPaginados = filteredClubs.slice((pagina - 1) * elementosPorPagina, pagina * elementosPorPagina);

    return (
        <div className="min-h-screen bg-gradient-to-b from-black to-[#0c0815] text-white">
            <div className="relative py-16 px-4 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-gradient-to-br from-fuchsia-900/20 to-transparent blur-3xl"></div>
                    <div className="absolute top-1/2 right-0 w-80 h-80 rounded-full bg-gradient-to-bl from-purple-900/20 to-transparent blur-3xl"></div>
                </div>
                
                <div className="relative z-10 container mx-auto max-w-5xl">
                    <h1 className="text-4xl md:text-5xl font-bold text-center mb-3 neon-fuchsia font-display tracking-tight">
                        Discotecas
                    </h1>
                    <div className="w-24 h-1 bg-gradient-to-r from-fuchsia-500 to-purple-800 mx-auto mb-8"></div>
                    <p className="text-center text-gray-300 max-w-2xl mx-auto mb-10">
                        Descubre las mejores discotecas y explora su oferta musical
                    </p>
                    
                    <div className="mb-12">
                        <form className="p-6 rounded-xl backdrop-blur-sm bg-[#121930]/50 border border-fuchsia-900/30 shadow-lg">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-fuchsia-200 text-sm font-medium">Nombre</label>
                                    <input 
                                        className="p-3 rounded-lg bg-[#0f1124] border border-fuchsia-900/30 text-white focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 transition-all"
                                        placeholder="Buscar por nombre"
                                        value={nombre}
                                        onChange={e => setNombre(e.target.value)}
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-fuchsia-200 text-sm font-medium">Ubicación</label>
                                    <input
                                        className="p-3 rounded-lg bg-[#0f1124] border border-fuchsia-900/30 text-white focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 transition-all"
                                        placeholder="Ciudad o zona"
                                        value={ubicacion}
                                        onChange={e => setUbicacion(e.target.value)}
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-fuchsia-200 text-sm font-medium">Estilo musical</label>
                                    <input
                                        className="p-3 rounded-lg bg-[#0f1124] border border-fuchsia-900/30 text-white focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 transition-all"
                                        placeholder="Techno, House, etc."
                                        value={estilo}
                                        onChange={e => setEstilo(e.target.value)}
                                    />
                                </div>
                            </div>
                            
                            <div className="mt-4">
                                <label className="text-fuchsia-200 text-sm font-medium block mb-2">Rango de precios</label>
                                <PriceRangeSelector
                                    selectedRanges={selectedPriceRanges}
                                    onChange={setSelectedPriceRanges}
                                    className="flex flex-wrap gap-2"
                                />
                            </div>
                        </form>
                    </div>
                    {error && (
                        <div className="text-center py-12 px-4 bg-red-900/30 rounded-xl border border-red-600/30 backdrop-blur-sm mb-8">
                            <h3 className="text-xl font-medium text-red-300 mb-2">Error</h3>
                            <p className="text-gray-300">{error}</p>
                        </div>
                    )}
                    
                    <div className="flex flex-col gap-8 min-h-[300px]">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
                                <div className="w-16 h-16 border-4 border-fuchsia-600 border-t-transparent rounded-full animate-spin mb-4 shadow-lg shadow-fuchsia-600/30"></div>
                                <p className="text-fuchsia-300 font-medium text-lg tracking-wide animate-pulse">Cargando discotecas...</p>
                            </div>
                        ) : (
                            <>
                                {clubsPaginados.map(club => (
                                    <div key={club._id} onClick={() => navigate(`/clubs/${club._id}`)}>
                                        <ClubCard club={club} />
                                    </div>
                                ))}
                                {filteredClubs.length === 0 && !loading && (
                                    <div className="text-center py-12 px-4 bg-[#121930]/50 rounded-xl border border-fuchsia-900/30 backdrop-blur-sm">
                                        <h3 className="text-xl font-medium text-fuchsia-300 mb-2">No hay resultados</h3>
                                        <p className="text-gray-400">
                                            No encontramos discotecas que coincidan con tu búsqueda. Prueba con otros filtros.
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                      
                    {totalPaginas > 1 && !loading && (
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
                </div>                
                <div className="pb-10"></div>
            </div>
        </div>    
    );
}
