import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "../../components/Button";
import authAxios from "../../helpers/authAxios";

interface Tramo {
    hasta: number;
    precio: number;
}

interface Entrada {
    tipo: string;
    tramos: Tramo[];
}

interface Venta {
    tipoEntrada: string;
    total: number;
}

interface DjInfo {
    nombre: string;
    _id: string;
}

interface Evento {
    _id: string;
    nombre: string;
    fecha: string;
    djId: DjInfo | string;
    entradas: Entrada[];
    generos: string[];
}



const EventoDashboard = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [evento, setEvento] = useState<Evento | null>(null);
    const [ventas, setVentas] = useState<Venta[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [editMode, setEditMode] = useState(false);
    const [editEntradas, setEditEntradas] = useState<Entrada[]>([]);
    const [saving, setSaving] = useState(false);
    const [editError, setEditError] = useState("");
    const GENEROS_LISTA = [
        "Techno", "House", "Reggaeton", "Pop", "Trap", "EDM", "Indie", "Rock"
    ];
    const [generos, setGeneros] = useState<string[]>([]);
    const [generoNuevo, setGeneroNuevo] = useState("");
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [eventoRes, ventasRes] = await Promise.all([
                    authAxios.get(`/eventos/${id}`),
                    authAxios.get(`/entradas/ventas-por-evento/${id}`)
                ]);
                
                setEvento(eventoRes.data);
                setGeneros(eventoRes.data.generos || []);
                setVentas(ventasRes.data || []);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError("No se pudo cargar el evento");
                setVentas([]);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchData();
        }
    }, [id]);

    const startEdit = () => {
        setEditEntradas(JSON.parse(JSON.stringify(evento?.entradas || [])));
        setEditMode(true);
        setEditError("");
    };
    const cancelEdit = () => {
        setEditMode(false);
        setEditEntradas([]);
        setEditError("");
    };
    const addTipoEntrada = () => {
        setEditEntradas([...editEntradas, { tipo: "", tramos: [{ hasta: 1, precio: 0 }] }]);
    };
    const removeTipoEntrada = (idx: number) => {
        setEditEntradas(editEntradas.filter((_, i) => i !== idx));
    };
    const updateTipoEntrada = (idx: number, value: string) => {
        setEditEntradas(editEntradas.map((entrada, i) => i === idx ? { ...entrada, tipo: value } : entrada));
    };
    const addTramo = (idx: number) => {
        setEditEntradas(editEntradas.map((entrada, i) => i === idx ? { ...entrada, tramos: [...entrada.tramos, { hasta: 1, precio: 0 }] } : entrada));
    };
    const removeTramo = (idx: number, tramoIdx: number) => {
        setEditEntradas(editEntradas.map((entrada, i) => 
            i === idx ? { ...entrada, tramos: entrada.tramos.filter((_, j) => j !== tramoIdx) } : entrada
        ));
    };
    const updateTramo = (idx: number, tramoIdx: number, field: string, value: number) => {
        setEditEntradas(editEntradas.map((entrada, i) =>
            i === idx
                ? {
                    ...entrada,
                    tramos: entrada.tramos.map((tramo: any, j: number) =>
                        j === tramoIdx ? { ...tramo, [field]: value } : tramo
                    )
                }
                : entrada
        ));
    };
    const saveEdit = async () => {
        setSaving(true);
        setEditError("");
        try {
            const cleanEntradas = editEntradas.map(entrada => ({
                tipo: entrada.tipo.trim(),
                tramos: entrada.tramos
                    .filter((tramo: any) => tramo.hasta > 0 && tramo.precio >= 0)
                    .map((tramo: any) => ({
                        hasta: Math.max(1, parseInt(tramo.hasta)),
                        precio: Math.max(0, parseInt(tramo.precio))
                    }))
            })).filter(e => e.tipo && e.tramos.length > 0);
            await authAxios.put(`/eventos/${id}/entradas`, { entradas: cleanEntradas, generos });
            if (evento) {
                setEvento({ 
                    ...evento, 
                    entradas: cleanEntradas, 
                    generos 
                });
            }
            setEditMode(false);
        } catch (err: any) {
            setEditError(err?.response?.data?.message || "Error al guardar cambios");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-center mt-10">Cargando...</div>;
    if (error) return <div className="text-center text-red-500 mt-10">{error}</div>;
    if (!evento) return null;    const ventasData = evento.entradas.map((entrada: Entrada) => {
        const venta = ventas.find((v: Venta) => v.tipoEntrada === entrada.tipo);
        return {
            tipo: entrada.tipo,
            vendidas: venta ? venta.total : 0
        };
    });

    const totalVendidas = ventasData.reduce((acc, d) => acc + d.vendidas, 0);
    
    return (
        <div className="min-h-screen bg-gradient-to-b from-black to-[#0c0815] text-white px-4 py-12">
            <div className="relative overflow-hidden">
                {/* Elementos decorativos de fondo */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-gradient-to-br from-fuchsia-900/20 to-transparent blur-3xl"></div>
                    <div className="absolute top-1/2 right-0 w-80 h-80 rounded-full bg-gradient-to-bl from-purple-900/20 to-transparent blur-3xl"></div>
                </div>
                
                <div className="container mx-auto max-w-4xl relative z-10">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="mb-6 bg-[#121930]/80 hover:bg-[#1a1336]/80 text-gray-200 hover:text-white py-2 px-4 rounded-lg border border-fuchsia-900/30 flex items-center gap-2 transition-all"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                        </svg>
                        Volver
                    </button>
                    
                    <h1 className="text-3xl font-bold mb-4 neon-fuchsia font-display">{evento?.nombre}</h1>
                    <div className="bg-gradient-to-br from-[#121930] to-[#1a1336] rounded-xl shadow-xl p-6 mb-10 border border-fuchsia-900/20 backdrop-blur-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="bg-fuchsia-900/30 p-2 rounded-full">
                                    <svg className="w-4 h-4 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                </div>
                                <span className="text-gray-200">{new Date(evento?.fecha).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="bg-fuchsia-900/30 p-2 rounded-full">
                                    <svg className="w-4 h-4 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
                                    </svg>
                                </div>
                                <span className="text-gray-200">
                                    DJ: {typeof evento.djId === 'object' ? (evento.djId as DjInfo).nombre : evento.djId}
                                </span>
                            </div>
                        </div>
                        
                        <h2 className="text-xl font-medium text-fuchsia-300 mb-4">Tipos y tramos de entrada</h2>
                        {!editMode ? (
                            <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                {evento?.entradas?.map((entrada: Entrada, idx: number) => (
                                    <div key={idx} className="bg-[#121930]/80 p-4 border border-fuchsia-900/30 rounded-lg">
                                        <h3 className="font-bold text-fuchsia-200 mb-2">{entrada.tipo}</h3>
                                        <ul className="space-y-1">
                                            {entrada.tramos.map((tramo: Tramo, tIdx: number) => (
                                                <li key={tIdx} className="text-gray-300 flex justify-between">
                                                    <span>Hasta {tramo.hasta} entradas:</span>
                                                    <span className="font-medium">{tramo.precio}€</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                            <button 
                                onClick={startEdit} 
                                className="bg-fuchsia-900/40 text-fuchsia-300 hover:bg-fuchsia-800/60 hover:text-white transition-colors py-2 px-4 rounded-lg flex items-center gap-2 text-sm font-medium mb-6"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                                </svg>
                                Editar tipos/tramos de entrada
                            </button>
                            <div className="mb-6">
                                <h3 className="font-medium text-fuchsia-300 mb-3">Géneros musicales:</h3>
                                <div className="flex flex-wrap gap-2">
                                    {evento?.generos && evento?.generos.length > 0 ? evento?.generos.map((g: string) => (
                                        <span key={g} className="px-3 py-1.5 rounded-full bg-fuchsia-900/40 text-fuchsia-300 border border-fuchsia-700/30">{g}</span>
                                    )) : <span className="text-gray-400">Sin géneros asignados</span>}
                                </div>
                            </div>
                            </>
                        ) : (
                <div className="mb-4 w-full max-w-3xl max-h-[80vh] overflow-y-auto p-2">
                    {editEntradas.map((entrada, idx) => (
                        <div key={idx} className="mb-4 p-4 bg-[#121930]/80 border border-fuchsia-900/30 rounded-lg">
                            <div className="flex gap-2 items-center mb-4">
                                <input
                                    className="p-3 rounded-lg bg-[#0f1124] border border-fuchsia-900/30 text-white focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 transition-all flex-1"
                                    placeholder="Tipo de entrada"
                                    value={entrada.tipo}
                                    onChange={e => updateTipoEntrada(idx, e.target.value)}
                                    required
                                />
                                <button 
                                    type="button" 
                                    className="bg-red-900/40 text-red-300 hover:bg-red-800/60 hover:text-red-200 transition-colors py-2 px-4 rounded-lg text-sm"
                                    onClick={() => removeTipoEntrada(idx)} 
                                    disabled={editEntradas.length === 1}
                                >
                                    Eliminar tipo
                                </button>
                            </div>
                            <div className="ml-4 space-y-3">
                                {entrada.tramos.map((tramo: Tramo, tramoIdx: number) => (
                                    <div key={tramoIdx} className="flex gap-2 items-center">
                                        <input
                                            className="p-3 rounded-lg bg-[#0f1124] border border-fuchsia-900/30 text-white focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 transition-all w-24"
                                            type="number"
                                            min={1}
                                            step={1}
                                            placeholder="Hasta"
                                            value={tramo.hasta}
                                            onChange={e => updateTramo(idx, tramoIdx, 'hasta', Math.max(1, parseInt(e.target.value) || 1))}
                                            required
                                        />
                                        <input                                            className="p-3 rounded-lg bg-[#0f1124] border border-fuchsia-900/30 text-white focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 transition-all w-24"
                                            type="number"
                                            min={0}
                                            step={1}
                                            placeholder="Precio (€)"
                                            value={tramo.precio}
                                            onChange={e => updateTramo(idx, tramoIdx, 'precio', Math.max(0, parseInt(e.target.value) || 0))}
                                            required
                                        />
                                        <button 
                                            type="button" 
                                            className="bg-red-900/40 text-red-300 hover:bg-red-800/60 hover:text-red-200 transition-colors py-2 px-4 rounded-lg text-sm"
                                            onClick={() => removeTramo(idx, tramoIdx)} 
                                            disabled={entrada.tramos.length === 1}
                                        >
                                            Eliminar tramo
                                        </button>
                                    </div>
                                ))}
                                <button 
                                    type="button" 
                                    className="text-sm text-fuchsia-300 hover:text-fuchsia-200 transition-colors mt-2 flex items-center gap-1"
                                    onClick={() => addTramo(idx)}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                    </svg>
                                    Añadir tramo
                                </button>
                            </div>
                        </div>
                    ))}
                    <button 
                        type="button" 
                        className="bg-fuchsia-900/40 text-fuchsia-300 hover:bg-fuchsia-800/60 hover:text-white transition-colors py-2 px-4 rounded-lg flex items-center gap-2 text-sm font-medium mt-4"
                        onClick={addTipoEntrada}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Añadir tipo de entrada
                    </button>                    <div className="mb-6">
                        <label className="block text-fuchsia-300 font-medium mb-3">Géneros musicales</label>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {GENEROS_LISTA.map(g => (
                                <button
                                    type="button"
                                    key={g}
                                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                                        generos.includes(g) 
                                            ? 'bg-fuchsia-900/40 text-fuchsia-300 border border-fuchsia-700/50' 
                                            : 'bg-[#0f1124] text-gray-300 border border-fuchsia-900/30 hover:border-fuchsia-700/50 hover:bg-fuchsia-900/20'
                                    }`}
                                    onClick={() => setGeneros(generos.includes(g) ? generos.filter(x => x !== g) : [...generos, g])}
                                >
                                    {g}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2 items-center">
                            <input
                                className="p-3 rounded-lg bg-[#0f1124] border border-fuchsia-900/30 text-white placeholder-gray-500 focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 transition-all flex-1"
                                placeholder="Añadir género personalizado"
                                value={generoNuevo}
                                onChange={e => setGeneroNuevo(e.target.value)}
                            />
                            <button
                                type="button"
                                className="bg-fuchsia-900/40 text-fuchsia-300 hover:bg-fuchsia-800/60 hover:text-fuchsia-200 transition-colors py-3 px-4 rounded-lg text-sm font-medium"
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
                        <p className="mt-2 text-xs text-gray-400">Selecciona uno o varios géneros o añade uno nuevo.</p>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <Button onClick={saveEdit} disabled={saving}>{saving ? "Guardando..." : "Guardar cambios"}</Button>
                        <Button onClick={cancelEdit} type="button" disabled={saving}>Cancelar</Button>
                    </div>
                    {editError && <p className="text-red-500 mt-2">{editError}</p>}
                </div>
            )}
            <h2 className="text-xl font-medium text-fuchsia-300 mb-4">Ventas por tipo de entrada</h2>
            <div className="bg-[#121930]/80 p-6 border border-fuchsia-900/30 rounded-lg">
                <h3 className="text-lg font-medium text-fuchsia-200 mb-4">Resumen de ventas</h3>
                <div className="space-y-4">
                    {ventasData.map((venta) => (
                        <div key={venta.tipo} className="bg-[#0f1124] p-4 rounded-lg border border-fuchsia-900/30">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-300">{venta.tipo}:</span>
                                <span className="text-fuchsia-300 font-medium">{venta.vendidas} vendidas</span>
                            </div>
                        </div>
                    ))}
                    {ventasData.length === 0 && (
                        <p className="text-gray-400 text-sm">No hay ventas registradas</p>
                    )}
                    <div className="mt-6 pt-4 border-t border-fuchsia-900/30">
                        <div className="flex justify-between items-center">
                            <span className="text-fuchsia-200 font-medium">Total de entradas vendidas:</span>
                            <span className="text-fuchsia-300 font-bold text-lg">{totalVendidas}</span>
                        </div>
                    </div>
                </div>
            </div>
                </div>
              </div>
            </div>
        </div>
    );
};

export default EventoDashboard;
