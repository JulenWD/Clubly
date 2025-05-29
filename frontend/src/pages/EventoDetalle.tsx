import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUserContext } from "../context/userContext";
import type { Evento } from "../types/Evento";
import { auth } from "../firebase.config";
import PriceRangeIndicator from "../components/PriceRangeIndicator";
import { getEffectivePriceRange } from "../helpers/priceRangeHelpers";

const EventoDetalle = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [evento, setEvento] = useState<Evento | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [comprando, setComprando] = useState<string | null>(null);
    const [compraError, setCompraError] = useState("");
    const { api, user } = useUserContext();

    useEffect(() => {
        const fetchEvento = async () => {
            try {
                const res = await api.get(`/eventos/${id}`);
                if (!res.data) {
                    throw new Error('No se recibieron datos del evento');
                }
                setEvento(res.data);
            } catch (err: any) {
                setError(err.response?.data?.message || "No se pudo cargar el evento");
            } finally {
                setLoading(false);
            }
        };
        fetchEvento();
    }, [id, api]);

    const handleComprar = async (tipoEntrada: string) => {
        setComprando(tipoEntrada);
        setCompraError("");

        if (!user || !auth.currentUser) {
            sessionStorage.setItem('redirect_after_login', `/eventos/${id}`);
            sessionStorage.setItem('selected_ticket_type', tipoEntrada);
            navigate('/login');
            return;
        }

        try {
            if (auth.currentUser) {
                try {
                    await auth.currentUser.getIdToken(true);
                } catch (e) {
                }
            }

            const res = await api.post("/pagos/crear-sesion", {
                eventoId: evento?._id,
                tipoEntrada
            });

            sessionStorage.setItem('clubly_pago_en_proceso', 'true');
            sessionStorage.setItem('last_user_email', user.email || '');

            if (res.data.url) {
                const url = new URL(res.data.url);
                url.searchParams.set("evento", evento?.nombre || '');
                window.location.href = url.toString();
            } else {
                throw new Error("No se recibió URL de pago");
            }
        } catch (err: any) {
            setCompraError(err.response?.data?.message || "Error al iniciar el pago. Inténtalo de nuevo más tarde.");
        } finally {
            setComprando(null);
        }
    };

    const getPrecioYStock = (entrada: Evento['entradas'][0]) => {
        if (!entrada.tramos || entrada.tramos.length === 0) return { precio: "-", quedan: null };
        const vendidas = evento?.ventasPorTipo?.[entrada.tipo] || 0;

        for (const tramo of entrada.tramos) {
            if (vendidas < tramo.hasta) {
                return {
                    precio: tramo.precio,
                    quedan: tramo.hasta - vendidas
                };
            }
        }
        return { precio: "-", quedan: 0 };
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#0f1224] to-[#120e29] flex items-center justify-center pt-20">
                <div className="text-white text-xl flex items-center bg-slate-800/50 backdrop-blur-md p-6 rounded-lg shadow-lg border border-slate-700/30">
                    <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-fuchsia-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Cargando evento...
                </div>
            </div>
        );
    }

    if (error || !evento) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#0f1224] to-[#120e29] flex items-center justify-center pt-20">
                <div className="text-red-400 text-xl flex items-center bg-slate-800/50 backdrop-blur-md p-6 rounded-lg shadow-lg border border-red-500/30">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mr-3 text-red-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    {error || "No se encontró el evento"}
                </div>
            </div>
        );
    }
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0f1224] to-[#120e29] pt-16">
            <div className="container mx-auto px-4 pt-8 pb-16 max-w-6xl">
                <div className="flex flex-col md:flex-row gap-5 mb-6">
                    <div className="md:w-1/3">
                        <div className="aspect-[2/3] rounded-lg overflow-hidden shadow-lg shadow-purple-900/20">
                            <img
                                src={evento.imagen || evento.cartelUrl}
                                alt={evento.nombre}
                                className="w-full h-full object-contain bg-slate-900/70"
                            />
                        </div>
                    </div>
                    <div className="md:w-2/3 flex flex-col">
                        <div className="bg-slate-800/50 backdrop-blur-md rounded-lg shadow-xl overflow-hidden p-6 flex-1 border border-slate-700/30">
                            <div className="mb-5">
                                <div className="mb-3 uppercase flex items-center space-x-2">
                                    <span className="bg-fuchsia-600 text-white px-2 py-1 rounded-lg text-sm font-semibold">
                                        {new Date(evento.fecha).toLocaleDateString('es-ES', {
                                            weekday: 'short',
                                        }).toUpperCase()}
                                    </span>
                                    <span className="text-gray-300 font-medium">
                                        {new Date(evento.fecha).toLocaleDateString('es-ES', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric'
                                        }).toUpperCase()}
                                    </span>
                                    {evento.hora && (
                                        <span className="bg-indigo-600/50 text-white px-2 py-1 rounded-lg text-sm font-semibold">
                                            {evento.hora}
                                        </span>
                                    )}
                                </div>
                                <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 font-display neon-text-purple">
                                    {evento.nombre}
                                </h1>
                                <div className="flex items-center space-x-2 text-gray-300 mb-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-fuchsia-500">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                    </svg>
                                    <div>
                                        <span className="font-semibold">{evento.club?.nombre || evento.clubId?.nombre || "Por confirmar"}</span>
                                    </div>
                                    {(evento.club?.priceRangeCalculated || evento.club?.priceRangeInitial || evento.club?.priceRange ||
                                        evento.clubId?.priceRangeCalculated || evento.clubId?.priceRangeInitial || evento.clubId?.priceRange) && (
                                        <>
                                            <span className="mx-2">•</span>
                                            {(() => {
                                                const clubPriceRange = evento.club
                                                    ? getEffectivePriceRange(evento.club.priceRangeCalculated, evento.club.priceRangeInitial || evento.club.priceRange)
                                                    : getEffectivePriceRange(evento.clubId?.priceRangeCalculated, evento.clubId?.priceRangeInitial || evento.clubId?.priceRange);

                                                return clubPriceRange.priceRange ? (
                                                    <PriceRangeIndicator
                                                        priceRange={clubPriceRange.priceRange}
                                                        verified={clubPriceRange.verified}
                                                        size="sm"
                                                        className="bg-blue-900/40 rounded-full px-2 py-0.5"
                                                    />
                                                ) : null;
                                            })()}
                                        </>
                                    )}
                                </div>
                                {evento.generos && evento.generos.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-5">
                                        {evento.generos.map((genero, index) => (
                                            <span key={index} className="bg-purple-900/40 text-fuchsia-300 px-3 py-1 rounded-full text-sm">
                                                {genero}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="mb-4">
                                <h2 className="text-lg font-semibold text-white mb-2">Sobre este evento</h2>
                                <p className="text-gray-300 mb-3">{evento.descripcion || 'Sin descripción disponible'}</p>
                                <div className="mt-4 bg-[#111327] rounded-lg border border-[#1d2040] p-4">
                                    <div className="flex items-start space-x-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-fuchsia-500 mt-0.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                        </svg>
                                        <div>
                                            <h3 className="text-fuchsia-300 text-sm font-medium mb-1">Ubicación:</h3>
                                            <p className="text-gray-300">{evento.club?.ubicacion || evento.clubId?.ubicacion || "Ciudad desconocida"}</p>
                                            <p className="text-fuchsia-200/70 text-sm mt-1">
                                                {evento.club?.direccion || evento.clubId?.direccion || "Ubicación exacta desconocida"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-[#0c0e1a] backdrop-blur-md rounded-xl shadow-xl overflow-hidden p-6 border border-[#1a1e33] mb-6">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#d946ef" className="w-7 h-7 mr-3">
                            <path d="M4 3a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V3zm0 8a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8z" />
                        </svg>
                        ENTRADAS
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.isArray(evento.entradas) && evento.entradas.length > 0 ? (
                            evento.entradas.map((entrada) => {
                                const { precio, quedan } = getPrecioYStock(entrada);
                                const agotado = quedan === 0;

                                return (
                                    <div key={entrada._id} className="bg-[#111327] border border-[#1d2040] p-5 rounded-xl hover:border-fuchsia-500/40 hover:shadow-lg hover:shadow-fuchsia-500/20 transition-all">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-xl font-bold text-white">{entrada.tipo}</h3>
                                            <span className="text-2xl font-bold text-fuchsia-400">{precio}€</span>
                                        </div>
                                        {quedan !== null && (
                                            <div className="text-gray-400 text-sm mb-4 flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-fuchsia-400">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                                                </svg>
                                                {agotado ? "Agotado" : `${quedan} entradas disponibles`}
                                            </div>
                                        )}
                                        <button
                                            onClick={() => !agotado && !comprando && handleComprar(entrada.tipo)}
                                            disabled={agotado || comprando === entrada.tipo}
                                            className={`w-full py-2.5 rounded-xl flex items-center justify-center font-medium text-white ${agotado
                                                ? 'bg-gray-700/50 cursor-not-allowed'
                                                : 'bg-[#1967d2] hover:bg-[#1a5dc2] transition-colors'}`}
                                        >
                                            {comprando === entrada.tipo ? (
                                                <div className="flex items-center justify-center">
                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Procesando...
                                                </div>
                                            ) : agotado ? 'Agotado' : (
                                                <div className="flex items-center justify-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                                                    </svg>
                                                    Comprar
                                                </div>
                                            )}
                                        </button>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="col-span-full text-center p-8 bg-[#111327] rounded-xl border border-[#1d2040]">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto text-fuchsia-400/50 mb-3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                </svg>
                                <p className="text-gray-300 text-lg">No hay entradas disponibles en este momento</p>
                            </div>
                        )}
                    </div>
                    {compraError && (
                        <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
                            <div className="flex items-start">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2 text-red-400 flex-shrink-0 mt-0.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                </svg>
                                <span>{compraError}</span>
                            </div>
                        </div>
                    )}
                </div>
                <div className="pb-10"></div>
            </div>
        </div>
    );
};

export default EventoDetalle;
