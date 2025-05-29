import { useEffect, useState } from "react";
import { useUserContext } from "../../context/userContext";
import { useNavigate } from "react-router-dom";
import { Star, CheckCircle, TrendingUp } from "lucide-react";
import { uploadImageToCloudinary } from "../../helpers/uploadImageToCloudinary";
import { auth } from "../../firebase.config";
import { EstadoSolicitud } from "../../types/EventoDestacado";

interface ClubType {
    _id: string;
    nombre: string;
    ubicacion: string;
    direccion?: string;
    descripcion?: string;
    telefono?: string;
}

interface EventoType {
    _id: string;
    nombre: string;
    fecha: string;
    djId: string;
    descripcion: string;
    clubId: string;
    entradas: any[];
}

const GENEROS_LISTA = [
    "Techno", "House", "Reggaeton", "Pop", "Trap", "EDM", "Indie", "Rock"
];

const CrearEventoModal = ({ open, onClose, onCreated, clubId, djs }: { open: boolean, onClose: () => void, onCreated: () => void, clubId: string, djs: { _id: string, nombre: string, verificado?: boolean }[] }) => {
    const { api } = useUserContext();
    const [nombre, setNombre] = useState("");
    const [fecha, setFecha] = useState("");
    const [djSearch, setDjSearch] = useState("");
    const [selectedDjs, setSelectedDjs] = useState<{ _id: string, nombre: string }[]>([]);
    const [entradas, setEntradas] = useState([
        {
            tipo: "General",
            tramos: [
                { hasta: 100, precio: 10 }
            ]
        }
    ]);
    const [generos, setGeneros] = useState<string[]>([]);
    const [generoNuevo, setGeneroNuevo] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [cartelUrl, setCartelUrl] = useState("");
    const [cartelFile, setCartelFile] = useState<File | null>(null);
    const [cartelLoading, setCartelLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    if (!open) return null;

    const addTipoEntrada = () => {
        setEntradas([...entradas, { tipo: "", tramos: [{ hasta: 1, precio: 0 }] }]);
    };
    const removeTipoEntrada = (idx: number) => {
        setEntradas(entradas.filter((_, i) => i !== idx));
    };
    const updateTipoEntrada = (idx: number, value: string) => {
        setEntradas(entradas.map((entrada, i) => i === idx ? { ...entrada, tipo: value } : entrada));
    };
    const addTramo = (idx: number) => {
        setEntradas(entradas.map((entrada, i) => i === idx ? { ...entrada, tramos: [...entrada.tramos, { hasta: 1, precio: 0 }] } : entrada));
    };
    const removeTramo = (idx: number, tramoIdx: number) => {
        setEntradas(entradas.map((entrada, i) => i === idx ? { ...entrada, tramos: entrada.tramos.filter((_, j) => j !== tramoIdx) } : entrada));
    };
    const updateTramo = (idx: number, tramoIdx: number, field: string, value: number) => {
        setEntradas(entradas.map((entrada, i) =>
            i === idx
                ? {
                    ...entrada,
                    tramos: entrada.tramos.map((tramo, j) =>
                        j === tramoIdx ? { ...tramo, [field]: value } : tramo
                    )
                }
                : entrada
        ));
    };

    const filteredDjs = djs
        .filter(dj => dj.verificado === true)
        .filter(dj => djSearch === '' || dj.nombre.toLowerCase().includes(djSearch.toLowerCase()));

    const handleAddDj = (dj: { _id: string, nombre: string }) => {
        setSelectedDjs([...selectedDjs, dj]);
    };
    const handleRemoveDj = (djId: string) => {
        setSelectedDjs(selectedDjs.filter(dj => dj._id !== djId));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        let finalCartelUrl = cartelUrl;
        try {
            if (!cartelFile && !cartelUrl) {
                setError("Debes subir un cartel para el evento (imagen o URL)");
                setLoading(false);
                return;
            }
            setCartelLoading(true);
            if (cartelFile) {
                finalCartelUrl = await uploadImageToCloudinary(cartelFile, "Clubly", "clubly");
            } else if (cartelUrl && cartelUrl.startsWith("http")) {
                finalCartelUrl = await uploadImageToCloudinary(cartelUrl, "Clubly", "clubly");
            }
            setCartelLoading(false);
            await api.post("/eventos", {
                nombre,
                fecha,
                clubId,
                djIds: selectedDjs.map(dj => dj._id),
                generos,
                entradas,
                cartelUrl: finalCartelUrl
            });
            setNombre("");
            setFecha("");
            setSelectedDjs([]);
            setEntradas([
                {
                    tipo: "General",
                    tramos: [
                        { hasta: 100, precio: 10 }
                    ]
                }
            ]);
            setGeneros([]);
            setGeneroNuevo("");
            setCartelUrl("");
            setCartelFile(null);
            onCreated();
            onClose();
        } catch (err: any) {
            setError(err?.response?.data?.message || "Error al crear el evento");
        } finally {
            setLoading(false);
            setCartelLoading(false);
        }
    };    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-auto bg-black/60 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="bg-gradient-to-br from-[#121930] to-[#1a1336] p-6 rounded-xl shadow-xl w-full max-w-2xl border border-fuchsia-900/30 max-h-[80vh] overflow-y-auto flex flex-col">
                <h2 className="text-2xl font-bold mb-6 text-fuchsia-300 font-display">Crear nuevo evento</h2>
                <div className="flex flex-wrap gap-4 mb-4">
                    <input
                        className="flex-1 min-w-[200px] p-3 rounded-lg bg-[#0f1124] border border-fuchsia-900/30 text-white focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 transition-all"
                        placeholder="Nombre del evento"
                        value={nombre}
                        onChange={e => setNombre(e.target.value)}
                        required
                    />
                    <input
                        className="flex-1 min-w-[200px] p-3 rounded-lg bg-[#0f1124] border border-fuchsia-900/30 text-white focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 transition-all"
                        type="datetime-local"
                        value={fecha}
                        onChange={e => setFecha(e.target.value)}
                        required
                    />
                    <div className="flex-1 min-w-[200px]">
                        <span className="block mb-2 text-fuchsia-200">DJs Verificados:</span>
                        <div className="relative w-full">
                            <input
                                type="text"
                                placeholder="Buscar DJ por nombre"
                                value={djSearch}
                                onChange={e => setDjSearch(e.target.value)}
                                onFocus={() => setShowDropdown(true)}
                                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                                className="w-full p-3 rounded-lg bg-[#0f1124] border border-fuchsia-900/30 text-white focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 transition-all mb-2"
                            />
                            {showDropdown && filteredDjs.length > 0 && (
                                <div
                                    className="absolute left-0 z-50 bg-[#121930] border border-fuchsia-900/30 rounded-lg shadow-lg shadow-fuchsia-900/20 max-h-40 overflow-y-auto w-full"
                                >
                                    {filteredDjs.map(dj => (
                                        <div
                                            key={dj._id}
                                            className="px-3 py-2 hover:bg-fuchsia-800/30 cursor-pointer text-white"
                                            onMouseDown={() => { handleAddDj(dj); setDjSearch(''); }}
                                        >
                                            {dj.nombre}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {selectedDjs.map(dj => (
                                <span key={dj._id} className="bg-fuchsia-900/40 text-fuchsia-300 px-3 py-1 rounded-full flex items-center gap-1 border border-fuchsia-700/30">
                                    {dj.nombre}
                                    <button type="button" onClick={() => handleRemoveDj(dj._id)} className="ml-1 text-xs hover:text-white">✕</button>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>                <div className="mb-6">
                    <label className="block font-semibold mb-3 text-fuchsia-200">Géneros musicales:</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {GENEROS_LISTA.map(g => (
                            <button
                                type="button"
                                key={g}
                                className={`px-3 py-1.5 rounded-full border ${generos.includes(g) ? 'bg-fuchsia-700 text-white border-fuchsia-500' : 'bg-[#121930] border-fuchsia-900/30 text-gray-300 hover:bg-fuchsia-900/30'}`}
                                onClick={() => setGeneros(generos.includes(g) ? generos.filter(x => x !== g) : [...generos, g])}
                            >
                                {g}
                            </button>
                        ))}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {generos.map(g => (
                            <span key={g} className="bg-fuchsia-900/40 text-fuchsia-300 px-3 py-1.5 rounded-full flex items-center gap-1 border border-fuchsia-700/30">
                                {g}
                                <button type="button" onClick={() => setGeneros(generos.filter(x => x !== g))} className="ml-1 text-xs hover:text-white">✕</button>
                            </span>
                        ))}
                    </div>
                    <div className="flex gap-2 items-center">
                        <input
                            className="p-3 rounded-lg flex-1 bg-[#0f1124] border border-fuchsia-900/30 text-white focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 transition-all"
                            placeholder="Añadir género personalizado"
                            value={generoNuevo}
                            onChange={e => setGeneroNuevo(e.target.value)}
                        />
                        <button
                            type="button"
                            className="bg-fuchsia-900/40 text-fuchsia-300 hover:bg-fuchsia-800/50 hover:text-white px-4 py-3 rounded-lg transition-colors"
                            onClick={() => {
                                if (generoNuevo.trim() && !generos.includes(generoNuevo.trim())) {
                                    setGeneros([...generos, generoNuevo.trim()]);
                                    setGeneroNuevo("");
                                }
                            }}
                        >
                            Añadir
                        </button>
                    </div>
                    <div className="mt-2 text-sm text-fuchsia-200/60">Selecciona uno o varios géneros o añade uno nuevo.</div>
                </div>                <div className="mb-6">
                    <label className="block font-semibold mb-3 text-fuchsia-200">Cartel del evento <span className="text-red-400">*</span></label>
                    <div className="flex flex-col md:flex-row gap-3 items-center">
                        <input
                            type="text"
                            placeholder="URL de imagen del cartel"
                            value={cartelUrl}
                            onChange={e => setCartelUrl(e.target.value)}
                            className="p-3 rounded-lg bg-[#0f1124] border border-fuchsia-900/30 text-white focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 transition-all w-full md:w-auto flex-1"
                        />
                        <label className="bg-fuchsia-900/40 text-fuchsia-300 hover:bg-fuchsia-800/50 hover:text-white px-4 py-3 rounded-lg transition-colors cursor-pointer w-full md:w-auto text-center">
                            <span>Seleccionar archivo</span>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={e => setCartelFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
                                className="hidden"
                            />
                        </label>
                        {cartelLoading && <span className="text-sm text-fuchsia-300 animate-pulse">Subiendo cartel...</span>}
                    </div>
                    {cartelFile && (
                        <div className="mt-2 text-sm text-fuchsia-300">
                            Archivo seleccionado: {cartelFile.name}
                        </div>
                    )}
                    <div className="mt-2 text-sm text-fuchsia-200/60">Sube una imagen o pega una URL. El cartel es obligatorio.</div>
                </div>                <div className="mb-6">
                    <label className="block font-semibold mb-3 text-fuchsia-200">Tipos y tramos de entrada:</label>
                    <div className="flex flex-col gap-3">
                        {entradas.map((entrada, idx) => (
                            <div key={idx} className="border border-fuchsia-900/30 rounded-lg p-4 bg-[#121930]/80 flex flex-col md:flex-row md:items-start md:gap-4 mb-2">
                                <div className="flex flex-col md:w-1/4 mb-3 md:mb-0">
                                    <input
                                        className="p-3 rounded-lg bg-[#0f1124] border border-fuchsia-900/30 text-white focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 transition-all mb-2"
                                        placeholder="Tipo de entrada"
                                        value={entrada.tipo}
                                        onChange={e => updateTipoEntrada(idx, e.target.value)}
                                        required
                                    />
                                    <button 
                                        type="button" 
                                        className="text-red-400 hover:text-red-300 text-sm bg-red-900/20 px-3 py-1.5 rounded-lg border border-red-900/30 disabled:opacity-50 transition-colors"
                                        onClick={() => removeTipoEntrada(idx)} 
                                        disabled={entradas.length === 1}
                                    >
                                        Eliminar tipo
                                    </button>
                                </div>
                                <div className="flex-1 flex flex-col gap-3">
                                    {entrada.tramos.map((tramo, tramoIdx) => (
                                        <div key={tramoIdx} className="flex flex-wrap gap-3 items-center bg-[#0f1124]/50 p-3 rounded-lg border border-fuchsia-900/20">
                                            <div className="flex flex-col">
                                                <label className="text-xs text-fuchsia-200/60 mb-1">Hasta</label>
                                                <input
                                                    className="p-2 rounded-lg bg-[#0f1124] border border-fuchsia-900/30 text-white focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 transition-all w-24"
                                                    type="number"
                                                    min={1}
                                                    placeholder="Hasta"
                                                    value={tramo.hasta}
                                                    onChange={e => updateTramo(idx, tramoIdx, 'hasta', Number(e.target.value))}
                                                    required
                                                />
                                            </div>
                                            <div className="flex flex-col">
                                                <label className="text-xs text-fuchsia-200/60 mb-1">Precio (€)</label>
                                                <input
                                                    className="p-2 rounded-lg bg-[#0f1124] border border-fuchsia-900/30 text-white focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 transition-all w-24"
                                                    type="number"
                                                    min={0}
                                                    step={0.01}
                                                    placeholder="Precio (€)"
                                                    value={tramo.precio}
                                                    onChange={e => updateTramo(idx, tramoIdx, 'precio', Number(e.target.value))}
                                                    required
                                                />
                                            </div>
                                            <button 
                                                type="button" 
                                                className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded-md border border-red-900/30 bg-red-900/20 disabled:opacity-50 transition-colors"
                                                onClick={() => removeTramo(idx, tramoIdx)} 
                                                disabled={entrada.tramos.length === 1}
                                            >
                                                Eliminar tramo
                                            </button>
                                        </div>
                                    ))}
                                    <button 
                                        type="button" 
                                        className="text-sm text-fuchsia-300 hover:text-fuchsia-200 mt-2 bg-fuchsia-900/20 px-3 py-1.5 rounded-lg border border-fuchsia-900/30 self-start transition-colors"
                                        onClick={() => addTramo(idx)}
                                    >
                                        + Añadir tramo
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button 
                        type="button" 
                        className="text-sm text-fuchsia-300 hover:text-fuchsia-200 mt-4 bg-fuchsia-900/30 px-4 py-2 rounded-lg border border-fuchsia-900/30 transition-colors"
                        onClick={addTipoEntrada}
                    >
                        + Añadir tipo de entrada
                    </button>
                </div>                {error && <p className="text-red-400 mb-4 bg-red-900/20 p-3 rounded-lg border border-red-900/30">{error}</p>}
                <div className="flex justify-end space-x-4 mt-4">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        disabled={loading}
                        className="bg-[#121930]/80 hover:bg-[#1a1336]/80 text-gray-300 hover:text-white py-3 px-6 rounded-lg border border-fuchsia-900/30 font-medium transition-all disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit" 
                        disabled={loading || cartelLoading}
                        className="bg-gradient-to-r from-fuchsia-600 to-purple-700 hover:from-fuchsia-500 hover:to-purple-600 py-3 px-6 rounded-lg text-white font-medium shadow-lg shadow-fuchsia-900/40 transition-all disabled:opacity-50"
                    >
                        {loading || cartelLoading ? "Creando..." : "Crear evento"}
                    </button>
                </div>
            </form>
        </div>
    );
};

// Aplicando el nuevo estilo moderno al componente principal
const ClubDashboard = () => {    const { user, api, setUser } = useUserContext();
    const navigate = useNavigate();
    const [club, setClub] = useState<ClubType | null>(null);
    const [eventos, setEventos] = useState<EventoType[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCrearEvento, setShowCrearEvento] = useState(false);
    const [djs, setDjs] = useState<{ _id: string, nombre: string, verificado?: boolean }[]>([]);
    const [media, setMedia] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);
    const [fotoUrl, setFotoUrl] = useState("");
    const [fotoFile, setFotoFile] = useState<File | null>(null);
    const [fotoLoading, setFotoLoading] = useState(false);
      // Estados para eventos destacados
    const [eventosDestacados, setEventosDestacados] = useState<Record<string, EstadoSolicitud>>({});
    const [procesandoDestacado, setProcesandoDestacado] = useState(false);
    
    // Estados para el formulario de edición del club
    const [editNombre, setEditNombre] = useState("");
    const [editUbicacion, setEditUbicacion] = useState("");
    const [editDireccion, setEditDireccion] = useState("");
    const [editDescripcion, setEditDescripcion] = useState("");
    const [editTelefono, setEditTelefono] = useState("");
    const [updateLoading, setUpdateLoading] = useState(false);

    // Función para cargar los datos del club en el formulario de edición
    const loadEditForm = () => {
        if (club) {
            setEditNombre(club.nombre || '');
            setEditUbicacion(club.ubicacion || '');
            setEditDireccion(club.direccion || '');
            setEditDescripcion(club.descripcion || '');
            setEditTelefono(club.telefono || '');
        }
    };

    // Función para actualizar los datos del club
    const handleUpdateClub = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdateLoading(true);
        try {
            if (!club?._id) return;

            await api.put(`/clubs/${club._id}`, {
                nombre: editNombre,
                ubicacion: editUbicacion,
                direccion: editDireccion,
                descripcion: editDescripcion,
                telefono: editTelefono,
            });

            // Actualizar el club en el estado
            setClub({
                ...club,
                nombre: editNombre,
                ubicacion: editUbicacion,
                direccion: editDireccion,
                descripcion: editDescripcion,
                telefono: editTelefono,
            });

            alert("Información del club actualizada correctamente");
        } catch (error) {
            console.error("Error al actualizar el club:", error);
            alert("Error al actualizar la información del club");
        } finally {
            setUpdateLoading(false);
        }
    };

    useEffect(() => {
        if (club) {
            loadEditForm();
        }
    }, [club]);    useEffect(() => {
        const fetchClubInfo = async () => {
            try {
                const res = await api.get(`/clubs/usuario/${user?.uid}`);
                setClub(res.data);
            } catch (err) {
                console.error("Error al obtener club:", err);
            }
        };

        const fetchEventos = async () => {
            try {
                const res = await api.get("/eventos/mis-eventos");
                setEventos(res.data);
            } catch (err) {
                console.error("Error al obtener eventos:", err);
            }
        };

        const fetchDjs = async () => {
            try {
                const res = await api.get("/djs");
                setDjs(res.data);
            } catch (err) {
                setDjs([]);
            }
        };

        const fetchReviews = async () => {
            if (!club?._id) return;
            try {
                const res = await api.get(`/reviews/club/${club._id}/media`);
                setMedia(res.data.media || 0);
                setTotalReviews(res.data.total || 0);
            } catch (err) {
                setMedia(0);
                setTotalReviews(0);
            }
        };        const fetchData = async () => {
            if (user?.rol?.toLowerCase() === "propietario") {
                await Promise.all([fetchClubInfo(), fetchEventos(), fetchDjs()]);
                await fetchReviews();
                await fetchEventosDestacados();
            }
            setLoading(false);
        };

        fetchData();    }, [user, club?._id]);

    const fetchEventos = async () => {
        try {
            const res = await api.get("/eventos/mis-eventos");
            setEventos(res.data);
        } catch (err) {
            console.error("Error al obtener eventos:", err);
        }
    };
      // Cargar el estado de los eventos destacados
    const fetchEventosDestacados = async () => {
        if (!club?._id) return;
        try {
            const res = await api.get(`/eventos-destacados/club/${club._id}`);
            const destacados: Record<string, EstadoSolicitud> = {};
            
            res.data.forEach((destacado: any) => {
                destacados[destacado.eventoId] = destacado.estado;
            });
            
            setEventosDestacados(destacados);
        } catch (err) {
            console.error("Error al obtener eventos destacados:", err);
        }
    };
    
    // Solicitar destacar un evento
    const solicitarDestacarEvento = async (eventoId: string) => {
        if (!club?._id || procesandoDestacado) return;
        
        setProcesandoDestacado(true);
        try {
            await api.post(`/eventos-destacados/solicitar/${eventoId}`, {
                clubId: club._id,
                ciudad: club.ubicacion
            });
            
            // Actualizar el estado local
            setEventosDestacados(prev => ({
                ...prev,
                [eventoId]: EstadoSolicitud.PENDIENTE
            }));
            
            alert("Solicitud enviada correctamente. Un administrador revisará tu solicitud.");
        } catch (err: any) {
            console.error("Error al solicitar destacar evento:", err);
            alert(err?.response?.data?.message || "Error al solicitar destacar el evento");
        } finally {
            setProcesandoDestacado(false);
        }
    };

    const handleFotoPerfil = async (e: React.FormEvent) => {
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
                finalUrl = await uploadImageToCloudinary(fotoFile, "Clubly", "clubly");
            } else if (fotoUrl && fotoUrl.startsWith("http")) {
                finalUrl = await uploadImageToCloudinary(fotoUrl, "Clubly", "clubly");
            }
            await api.put(`/usuarios/me`, { fotoPerfil: finalUrl });
            const response = await api.post('/auth/login', { idToken: await auth.currentUser?.getIdToken() });
            const perfil = response.data.perfil;
            setUser({
                ...perfil,
                fotoPerfilUrl: perfil.fotoPerfil || perfil.fotoPerfilUrl || ""
            });
            setFotoUrl("");
            setFotoFile(null);
        } catch {
            alert("Error al subir la imagen de perfil");
        } finally {
            setFotoLoading(false);
        }
    };

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
                        Panel del Club
                    </h1>
                    <div className="w-24 h-1 bg-gradient-to-r from-fuchsia-500 to-purple-800 mx-auto mb-8"></div>

                    {club ? (
                        <div className="bg-gradient-to-br from-[#121930] to-[#1a1336] rounded-xl shadow-xl p-6 border border-fuchsia-900/20 backdrop-blur-sm mb-10">
                            <div className="flex flex-col md:flex-row items-center gap-8">
                                <div className="w-36 h-36 rounded-full border-4 border-fuchsia-700/50 shadow-lg shadow-fuchsia-800/20 overflow-hidden relative flex-shrink-0">
                                    <img
                                        src={user?.fotoPerfilUrl || "/default-profile.png"}
                                        alt="Foto de perfil club"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                
                                <div className="flex-1 text-center md:text-left">
                                    <h2 className="text-3xl font-bold mb-3 neon-fuchsia font-display flex items-center gap-2 justify-center md:justify-start">
                                        {club.nombre}
                                        {user?.verificado && <CheckCircle className="text-fuchsia-500" size={24} />}
                                    </h2>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 mb-4">                                        <div className="flex items-center gap-2 text-gray-200 justify-center md:justify-start">
                                            <div className="bg-fuchsia-900/30 p-2 rounded-full">
                                                <svg className="w-4 h-4 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                            </div>                                            <span>{club.ubicacion || 'Sin ubicación'}</span>
                                            <span className="text-gray-400 ml-2">
                                                - {club.direccion || 'Ubicación exacta desconocida'}
                                            </span>
                                        </div>
                                        
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
                                    
                                    {club.descripcion && (
                                        <p className="text-gray-300 mt-2">{club.descripcion}</p>
                                    )}
                                </div>
                            </div>
                            
                            {user && (
                                <form onSubmit={handleFotoPerfil} className="mt-6 bg-[#121930]/50 rounded-lg p-4 border border-fuchsia-900/30">
                                    <h3 className="text-lg font-medium text-fuchsia-300 mb-3">Actualizar foto de perfil</h3>
                                    <div className="flex flex-col md:flex-row gap-3 items-center">
                                        <input 
                                            type="text" 
                                            placeholder="URL de imagen" 
                                            value={fotoUrl} 
                                            onChange={e => setFotoUrl(e.target.value)} 
                                            className="p-3 rounded-lg bg-[#0f1124] border border-fuchsia-900/30 text-white focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 transition-all flex-1"
                                        />
                                        <label className="bg-fuchsia-900/30 rounded-lg text-white p-2 px-4 cursor-pointer hover:bg-fuchsia-800/40 transition-all flex-shrink-0">
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
                                            className="bg-gradient-to-r from-fuchsia-600 to-purple-700 hover:from-fuchsia-500 hover:to-purple-600 py-2 px-4 rounded-lg text-white font-medium shadow-lg shadow-fuchsia-900/40 transition-all disabled:opacity-50"
                                            disabled={fotoLoading}
                                        >
                                            {fotoLoading ? "Subiendo..." : "Actualizar foto"}
                                        </button>
                                    </div>
                                    {fotoFile && (
                                        <div className="mt-2 text-sm text-gray-400">
                                            Archivo seleccionado: {fotoFile.name}
                                        </div>
                                    )}
                                </form>
                            )}

                            {/* Formulario para editar información del club */}
                            {user && club && (
                                <form onSubmit={handleUpdateClub} className="mt-6 bg-[#121930]/50 rounded-lg p-4 border border-fuchsia-900/30">
                                    <h3 className="text-lg font-medium text-fuchsia-300 mb-3">Editar información del club</h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Nombre
                                            </label>
                                            <input 
                                                type="text" 
                                                value={editNombre} 
                                                onChange={e => setEditNombre(e.target.value)}
                                                className="w-full p-3 rounded-lg bg-[#0f1124] border border-fuchsia-900/30 text-white focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 transition-all"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Teléfono
                                            </label>
                                            <input 
                                                type="text" 
                                                value={editTelefono} 
                                                onChange={e => setEditTelefono(e.target.value)}
                                                className="w-full p-3 rounded-lg bg-[#0f1124] border border-fuchsia-900/30 text-white focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Ubicación (Ciudad)
                                            </label>
                                            <input 
                                                type="text" 
                                                value={editUbicacion} 
                                                onChange={e => setEditUbicacion(e.target.value)}
                                                className="w-full p-3 rounded-lg bg-[#0f1124] border border-fuchsia-900/30 text-white focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 transition-all"
                                                required
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Dirección exacta
                                            </label>
                                            <input 
                                                type="text" 
                                                value={editDireccion} 
                                                onChange={e => setEditDireccion(e.target.value)}
                                                className="w-full p-3 rounded-lg bg-[#0f1124] border border-fuchsia-900/30 text-white focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 transition-all"
                                                placeholder="Calle, número, piso, etc."
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Descripción
                                        </label>
                                        <textarea 
                                            value={editDescripcion} 
                                            onChange={e => setEditDescripcion(e.target.value)}
                                            className="w-full p-3 rounded-lg bg-[#0f1124] border border-fuchsia-900/30 text-white focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 transition-all"
                                            rows={3}
                                        />
                                    </div>
                                    
                                    <div className="flex justify-end">
                                        <button 
                                            type="submit" 
                                            className="bg-gradient-to-r from-fuchsia-600 to-purple-700 hover:from-fuchsia-500 hover:to-purple-600 py-2 px-4 rounded-lg text-white font-medium shadow-lg shadow-fuchsia-900/40 transition-all disabled:opacity-50"
                                            disabled={updateLoading}
                                        >
                                            {updateLoading ? "Actualizando..." : "Guardar cambios"}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-12 px-4 bg-[#121930]/50 rounded-xl border border-fuchsia-900/30 backdrop-blur-sm">
                            <h3 className="text-xl font-medium text-fuchsia-300 mb-2">Club no encontrado</h3>
                            <p className="text-gray-400">No pudimos encontrar la información de tu club.</p>
                        </div>
                    )}

                    <div className="mb-10">                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold font-display neon-fuchsia">Eventos creados</h2>
                            <button 
                                onClick={() => setShowCrearEvento(true)} 
                                disabled={!user?.verificado}
                                className="bg-gradient-to-r from-fuchsia-600 to-purple-700 hover:from-fuchsia-500 hover:to-purple-600 py-2 px-4 rounded-lg text-white font-medium shadow-lg shadow-fuchsia-900/40 transition-all disabled:opacity-50"
                            >
                                Crear nuevo evento
                            </button>
                        </div>
                        
                        {!user?.verificado && (
                            <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-300 font-medium">
                                Tu cuenta debe estar verificada para poder crear eventos. Contacta con un administrador.
                            </div>
                        )}
                          <div className="mb-6 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg text-purple-300 flex items-center">
                            <TrendingUp className="w-5 h-5 mr-2 text-purple-400" />
                            <div>
                                <p className="font-medium">Eventos destacados</p>
                                <p className="text-sm text-purple-400">Puedes solicitar destacar tus eventos para que aparezcan en la sección de eventos destacados</p>
                            </div>
                        </div>

                        {eventos.length > 0 ? (
                            <div className="grid gap-6">
                                {eventos.map((evento) => (
                                    <div key={evento._id} className="bg-gradient-to-br from-[#121930] to-[#1a1336] rounded-xl shadow-lg overflow-hidden border border-fuchsia-900/20 hover:shadow-xl hover:shadow-fuchsia-600/20 hover:border-fuchsia-500/30 hover:scale-[1.01] transition-all duration-300 ease-in-out transform">
                                        <div className="p-6">                                            <h3 className="text-xl font-bold mb-2 text-white">{evento.nombre}</h3>
                                            <p className="text-gray-300 mb-3">{new Date(evento.fecha).toLocaleString()}</p>
                                            {evento.descripcion && <p className="text-gray-400 mb-4">{evento.descripcion}</p>}
                                            <div className="flex flex-wrap gap-3 mt-4">
                                                <button 
                                                    onClick={() => navigate(`/dashboards/evento/${evento._id}`)}
                                                    className="bg-fuchsia-900/40 text-fuchsia-300 hover:bg-fuchsia-800/60 hover:text-white transition-colors py-2 px-4 rounded-lg flex items-center gap-2 text-sm font-medium"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                                    Ver/Editar detalles
                                                </button>
                                                
                                                {/* Botón para destacar evento */}
                                                {eventosDestacados[evento._id] ? (
                                                    <button 
                                                        className={`py-2 px-4 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${
                                                            eventosDestacados[evento._id] === EstadoSolicitud.PENDIENTE 
                                                                ? "bg-yellow-900/40 text-yellow-300 hover:bg-yellow-800/50 hover:text-yellow-200" 
                                                                : eventosDestacados[evento._id] === EstadoSolicitud.APROBADA
                                                                ? "bg-green-900/40 text-green-300 hover:bg-green-800/50 hover:text-green-200"
                                                                : "bg-red-900/40 text-red-300 hover:bg-red-800/50 hover:text-red-200"
                                                        }`}
                                                        disabled={true}
                                                    >
                                                        {eventosDestacados[evento._id] === EstadoSolicitud.PENDIENTE && (
                                                            <>
                                                                <Star className="w-4 h-4" />
                                                                Solicitud pendiente
                                                            </>
                                                        )}
                                                        {eventosDestacados[evento._id] === EstadoSolicitud.APROBADA && (
                                                            <>
                                                                <CheckCircle className="w-4 h-4" />
                                                                Evento destacado
                                                            </>
                                                        )}
                                                        {eventosDestacados[evento._id] === EstadoSolicitud.DENEGADA && (
                                                            <>
                                                                <Star className="w-4 h-4" />
                                                                Solicitud denegada
                                                            </>
                                                        )}
                                                    </button>
                                                ) : (                                                    <button 
                                                        onClick={() => solicitarDestacarEvento(evento._id)}
                                                        className="bg-purple-900/40 text-purple-300 hover:bg-purple-800/60 hover:text-purple-200 transition-colors py-2 px-4 rounded-lg flex items-center gap-2 text-sm font-medium"
                                                        disabled={procesandoDestacado}
                                                    >
                                                        <TrendingUp className="w-4 h-4" />
                                                        {procesandoDestacado ? "Procesando..." : "Destacar evento"}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 px-4 bg-[#121930]/50 rounded-xl border border-fuchsia-900/30 backdrop-blur-sm">
                                <h3 className="text-xl font-medium text-fuchsia-300 mb-2">No hay eventos</h3>
                                <p className="text-gray-400">Aún no has creado ningún evento.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <CrearEventoModal
                open={showCrearEvento}
                onClose={() => setShowCrearEvento(false)}
                onCreated={fetchEventos}
                clubId={club ? (club as any)._id : ""}
                djs={djs}
            />
        </div>
    );
};

export default ClubDashboard;
