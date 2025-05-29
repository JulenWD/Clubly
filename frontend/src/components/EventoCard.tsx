import { Star, Calendar, MapPin, Music, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Evento } from "../types/Evento";
import PriceRangeIndicator from "./PriceRangeIndicator";
import { getEffectivePriceRange } from "../helpers/priceRangeHelpers";
import { EstadoSolicitud } from '../types/EventoDestacado';
import { useUserContext } from '../context/userContext';

interface Props {
    evento: Evento;
    isUserLogged: boolean;
    onVerDetalles: () => void;
    onComprar: () => void;
    mostrarBotonDestacar?: boolean;
    estadoDestacado?: EstadoSolicitud;
    onDestacar?: (eventoId: string) => Promise<void>;
    contadorEventosDestacados?: number;
}

export default function EventoCard({ 
    evento, 
    isUserLogged, 
    onVerDetalles, 
    onComprar, 
    mostrarBotonDestacar = false,
    estadoDestacado,
    onDestacar,
    contadorEventosDestacados
}: Props) {
    const { user } = useUserContext();
    const [isClubOwner, setIsClubOwner] = useState(false);
    const [procesando, setProcesando] = useState(false);
    
    // Verificar si el usuario es dueño del club
    useEffect(() => {
        if (user && user.rol === 'club' && user.clubId) {
            const clubIdEvento = evento.clubId?._id || evento.club?._id;
            setIsClubOwner(user.clubId === clubIdEvento);
        } else {
            setIsClubOwner(false);
        }
    }, [user, evento]);
    
    // Formatear fecha para mostrarla de forma más elegante
    const fechaEvento = new Date(evento.fecha);
    const options: Intl.DateTimeFormatOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };    const fechaFormateada = fechaEvento.toLocaleDateString("es-ES", options);
    
    // Capitalizar primera letra
    const fechaMostrar = fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1);
    
    // Manejar clic en la tarjeta (excepto en los botones)
    const handleCardClick = (e: React.MouseEvent) => {
        // Verificar que el clic no fue en un botón o enlace
        if (!(e.target as HTMLElement).closest('button') && 
            !(e.target as HTMLElement).closest('a')) {
            onVerDetalles();
        }
    };    return (
        <div 
            onClick={handleCardClick}
            className="bg-gradient-to-br from-[#121930] to-[#1a1336] rounded-lg shadow-lg overflow-hidden flex flex-col md:flex-row border border-fuchsia-900/20 md:h-[323px] hover:shadow-xl hover:shadow-fuchsia-600/20 hover:border-fuchsia-500/30 hover:scale-[1.01] hover:translate-y-[-2px] transition-all duration-300 ease-in-out transform cursor-pointer group p-1.5">
            <div className="h-[310px] md:h-full md:w-[200px] relative flex-shrink-0 bg-gradient-to-b from-[#0a0a14] to-[#090912] rounded-md overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none"></div>
                <img
                    src={evento.cartelUrl || "/placeholder.jpg"}
                    alt={`Cartel ${evento.nombre}`}                    
                    className="h-full w-full object-cover group-hover:scale-105 transition-all duration-700 ease-in-out z-20"
                    style={{ objectPosition: 'center top' }}/>
            </div>            <div className="flex flex-col justify-between p-5 md:w-[calc(100%-200px-1.25rem)] text-white ml-2 rounded-r-md">
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold font-display tracking-tight neon-fuchsia">
                        {evento.nombre}
                    </h2>                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                        <div className="flex items-center gap-3">                            <div className="bg-fuchsia-900/30 rounded-full p-2 group-hover:bg-fuchsia-800/40 transition-colors duration-300">
                                <Calendar size={16} className="text-fuchsia-400 group-hover:text-fuchsia-300 transition-colors duration-300" />
                            </div>
                            <p className="text-gray-200 font-medium text-base">
                                {fechaMostrar}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">                            <div className="bg-fuchsia-900/30 rounded-full p-2 group-hover:bg-fuchsia-800/40 transition-colors duration-300">
                                <MapPin size={16} className="text-fuchsia-400 group-hover:text-fuchsia-300 transition-colors duration-300" />
                            </div>
                            <div className="flex flex-col">
                                {evento.clubId && typeof evento.clubId === 'object' && 'nombre' in evento.clubId ? (                                    
                                    <div>
                                        <a
                                            href={`/clubs/${('id' in evento.clubId && evento.clubId.id) ? evento.clubId.id : (evento.clubId._id ? evento.clubId._id : '')}`}
                                            className="text-fuchsia-300 hover:text-fuchsia-400 hover:underline transition-all duration-300 font-medium"
                                        >
                                            {evento.clubId.nombre}
                                        </a>                                <p className="text-xs text-gray-400 mt-0.5">                                                {evento.clubId.ubicacion || "Ciudad desconocida"}
                                                {evento.clubId.direccion && (
                                                    <span className="text-fuchsia-200/70 ml-1">(dirección exacta)</span>
                                                )}
                                            </p>
                                        <div className="flex items-center mt-1 space-x-2">
                                            {evento.clubMedia !== undefined && typeof evento.clubMedia === 'number' && !isNaN(evento.clubMedia) && (
                                                <div className="flex items-center bg-fuchsia-900/40 rounded-full px-2 py-0.5 w-fit">
                                                    <Star size={14} className="text-yellow-300" fill="#FFD700" />
                                                    <span className="text-xs text-white ml-1 font-bold">{evento.clubMedia.toFixed(1)}</span>
                                                </div>
                                            )}

                                            {evento.clubId && (evento.clubId.priceRangeCalculated || evento.clubId.priceRangeInitial) && (
                                                (() => {
                                                    const { priceRange, verified } = getEffectivePriceRange(
                                                        evento.clubId.priceRangeCalculated,
                                                        evento.clubId.priceRangeInitial
                                                    );
                                                    return priceRange ? (
                                                        <PriceRangeIndicator 
                                                            priceRange={priceRange}
                                                            size="sm"
                                                            verified={verified}
                                                            className="bg-blue-900/40 rounded-full px-2 py-0.5"
                                                        />
                                                    ) : null;
                                                })()
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    "Desconocido"
                                )}
                            </div>
                        </div>

                        {evento.generos && evento.generos.length > 0 && (
                            <div className="flex items-center gap-3 col-span-full mt-2">                                <div className="bg-fuchsia-900/30 rounded-full p-2 group-hover:bg-fuchsia-800/40 transition-colors duration-300">
                                    <Music size={16} className="text-fuchsia-400 group-hover:text-fuchsia-300 transition-colors duration-300" />
                                </div>
                                <div className="flex flex-wrap gap-2 items-center">                                    {evento.generos.map((genero, index) => (
                                        <span 
                                            key={index} 
                                            className="text-sm bg-fuchsia-900/40 text-fuchsia-300 px-3 py-1 rounded-full border border-fuchsia-700/30 hover:bg-fuchsia-700/50 hover:border-fuchsia-500/50 hover:text-white hover:shadow-sm hover:shadow-fuchsia-500/20 transition-all duration-300 cursor-default"
                                        >
                                            {genero}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="mt-5 pt-3 border-t border-fuchsia-900/30">
                    <div className="flex flex-col gap-3 w-full">
                        {isUserLogged ? (
                            <div className="flex items-center gap-3 w-full">
                                <button
                                    className="bg-gradient-to-r from-fuchsia-600 to-purple-700 text-white px-5 py-2.5 rounded-md hover:from-fuchsia-500 hover:to-purple-600 transition-all duration-300 font-medium shadow-md flex-grow text-base"
                                    onClick={onComprar}
                                >
                                    Comprar Entrada
                                </button>
                                <button
                                    className="border border-fuchsia-500/50 text-fuchsia-400 px-5 py-2.5 rounded-md hover:bg-fuchsia-900/30 transition-colors text-base"
                                    onClick={onVerDetalles}
                                >
                                    Ver detalles
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => window.location.href = "/login"}
                                className="bg-gradient-to-r from-fuchsia-600 to-purple-700 text-white px-5 py-2.5 rounded-md hover:from-fuchsia-500 hover:to-purple-600 transition-all duration-300 font-medium shadow-md w-full text-base"
                            >
                                Iniciar sesión para reservar
                            </button>
                        )}
                        

                        {mostrarBotonDestacar && isClubOwner && (
                            <div className="w-full">                                {!estadoDestacado ? (                                    <button 
                                        className={`flex items-center justify-center gap-2 w-full bg-emerald-600/80 text-white px-4 py-2.5 rounded-md hover:bg-emerald-600 transition-all duration-300 ${procesando ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            if (!onDestacar || procesando) return;
                                            
                                            // Verificar límite de eventos destacados
                                            if (contadorEventosDestacados && contadorEventosDestacados >= 3) {
                                                alert('Has alcanzado el límite de 3 eventos destacados. Por favor, contacta a administración para más información.');
                                                return;
                                            }
                                            
                                            setProcesando(true);
                                            try {
                                                await onDestacar(evento._id);
                                            } finally {
                                                setProcesando(false);
                                            }
                                        }}
                                        disabled={procesando}
                                    >
                                        <TrendingUp size={18} />
                                        {procesando ? 'Procesando...' : 'Destacar evento'}
                                        {contadorEventosDestacados ? ` (${contadorEventosDestacados}/3)` : ''}
                                    </button>
                                ) :(
                                    <button 
                                        className={`flex items-center justify-center gap-2 w-full ${
                                            estadoDestacado === EstadoSolicitud.PENDIENTE 
                                                ? 'bg-amber-600/50 text-white' 
                                                : estadoDestacado === EstadoSolicitud.APROBADA
                                                    ? 'bg-green-600/50 text-white' 
                                                    : 'bg-red-600/50 text-white'
                                        } px-4 py-2.5 rounded-md transition-colors cursor-default`}
                                        disabled
                                    >
                                        <TrendingUp size={18} />
                                        {estadoDestacado === EstadoSolicitud.PENDIENTE 
                                            ? 'Solicitud enviada' 
                                            : estadoDestacado === EstadoSolicitud.APROBADA
                                                ? 'Evento destacado' 
                                                : 'Solicitud denegada'}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
