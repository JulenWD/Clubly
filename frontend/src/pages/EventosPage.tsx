import React, { useEffect, useState, useRef } from "react";
import { useUserContext } from "../context/userContext";
import FiltroEventos from "../components/FiltroEventos";
import EventoCard from "../components/EventoCard";
import { Evento } from "../types/Evento";
import { useNavigate, useLocation } from "react-router-dom";
import { FiltroState } from "../components/FiltroEventos";
import { PriceRange } from "../types/PriceRange";
import { EventoDestacadoService } from "../services/EventoDestacadoService";
import { EstadoSolicitud } from "../types/EventoDestacado";
import Loader from "../components/Loader";

export default function EventosPage(): React.ReactElement {
    const [eventos, setEventos] = useState<Evento[]>([]);
    const [filtros, setFiltros] = useState<FiltroState>({
        lugar: "",
        fecha: "",
        generos: [],
        orderByRating: true,
        priceRanges: []
    });
    const [pagina, setPagina] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [eventosDestacadosMap, setEventosDestacadosMap] = useState<Map<string, EstadoSolicitud>>(new Map());
    const [contadorEventosDestacados, setContadorEventosDestacados] = useState(0);

    const [, setCargandoEventosDestacados] = useState(true);
    const elementosPorPagina = 20;
    const navigate = useNavigate();
    const location = useLocation();
    const { api, user } = useUserContext();
    const orderByRelevanceRef = useRef(false);
    const orderByRatingRef = useRef(true);

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const lugarParam = searchParams.get('lugar') || '';
        const fechaParam = searchParams.get('fecha') || '';
        const generosParam = searchParams.get('generos');
        const orderByRelevanceParam = searchParams.get('orderByRelevance');
        const priceRangesParam = searchParams.get('priceRanges');

        orderByRelevanceRef.current = orderByRelevanceParam === 'true';
        orderByRatingRef.current = true;

        const nuevosFiltros: FiltroState = {
            lugar: lugarParam,
            fecha: fechaParam,
            generos: generosParam ? generosParam.split(',').map((g: string) => g.trim()) : [],
            orderByRating: true,
            priceRanges: priceRangesParam ? priceRangesParam.split(',').map((p: string) => parseInt(p.trim()) as PriceRange) : []
        };

        if (
            filtros.lugar !== nuevosFiltros.lugar ||
            filtros.fecha !== nuevosFiltros.fecha ||
            JSON.stringify(filtros.generos) !== JSON.stringify(nuevosFiltros.generos) ||
            JSON.stringify(filtros.priceRanges) !== JSON.stringify(nuevosFiltros.priceRanges)
        ) {
            setFiltros(nuevosFiltros);
        }
    }, [location.search]);

    // Cambia manejarBuscar para aceptar los filtros como argumento y navegar con ellos
    const manejarBuscar = (filtrosBusqueda: FiltroState) => {
        const params = new URLSearchParams();

        if (filtrosBusqueda.lugar && filtrosBusqueda.lugar.trim() !== "") {
            params.append("lugar", filtrosBusqueda.lugar.trim());
        }
        if (filtrosBusqueda.fecha && filtrosBusqueda.fecha.trim() !== "") {
            params.append("fecha", filtrosBusqueda.fecha.trim());
        }
        if (filtrosBusqueda.generos && filtrosBusqueda.generos.length > 0) {
            params.append("generos", filtrosBusqueda.generos.join(","));
            if (orderByRelevanceRef.current) {
                params.append("orderByRelevance", "true");
            }
        }
        if (filtrosBusqueda.priceRanges && filtrosBusqueda.priceRanges.length > 0) {
            params.append("priceRanges", filtrosBusqueda.priceRanges.join(","));
        }
        const queryString = params.toString();
        navigate(`/eventos${queryString ? `?${queryString}` : ''}`);
        setPagina(1);
    };

    useEffect(() => {
        const obtenerEventos = async () => {
            setIsLoading(true);
            try {
                const res = await api.get("/eventos");
                setEventos(res.data);
            } catch (error) {
            } finally {
                setTimeout(() => setIsLoading(false), 800);
            }
        };

        obtenerEventos();
    }, [api]);

    useEffect(() => {
        setPagina(1);
    }, [filtros]);

    const calcularRelevanciaGenero = (evento: Evento): number => {
        if (filtros.generos.length === 0) {
            return 1;
        }

        const generosEvento = evento.generos || [];
        if (generosEvento.length === 0) {
            return 0;
        }
        const generosEventoNormalizados = generosEvento.map((g: string) => g.toLowerCase().trim());
        const generosFiltro = filtros.generos.map((g: string) => g.toLowerCase().trim());

        let coincidencias = 0;
        generosFiltro.forEach((generoFiltro: string) => {
            const coincide = generosEventoNormalizados.some(generoEvento =>
                generoEvento === generoFiltro ||
                generoEvento.includes(generoFiltro) ||
                generoFiltro.includes(generoEvento)
            );

            if (coincide) {
                coincidencias++;
            }
        });

        if (coincidencias === 0) {
            return 0;
        }

        const ratioCoincidencia = coincidencias / generosFiltro.length;

        let especificidad = 0;

        if (coincidencias === generosFiltro.length) {
            especificidad = generosFiltro.length / generosEventoNormalizados.length;

            if (generosFiltro.length === generosEventoNormalizados.length) {
                especificidad = 1.2;
            }
        }
        const relevancia = ratioCoincidencia * 0.7 + especificidad * 0.3;
        return relevancia;
    };

    useEffect(() => {
        orderByRatingRef.current = true;
    }, []);

    useEffect(() => {
        async function cargarDatosEventosDestacados() {
            if (!user || user.rol !== 'club' || !user.clubId) {
                setCargandoEventosDestacados(false);
                return;
            }

            setCargandoEventosDestacados(true);

            try {
                const solicitudes = await EventoDestacadoService.obtenerSolicitudesPorClub(user.clubId);
                const nuevoMapa = new Map<string, EstadoSolicitud>();

                solicitudes.forEach((solicitud: any) => {
                    nuevoMapa.set(solicitud.eventoId._id, solicitud.estado);
                });

                setEventosDestacadosMap(nuevoMapa);

                if (user.ciudad) {
                    const total = await EventoDestacadoService.contarEventosDestacadosPorCiudad(user.ciudad);
                    setContadorEventosDestacados(total);
                }
            } catch (err) {
            } finally {
                setCargandoEventosDestacados(false);
            }
        }

        cargarDatosEventosDestacados();
    }, [user]);

    const manejarDestacarEvento = async (eventoId: string) => {
        if (!user || user.rol !== 'club' || !user.clubId || !user.ciudad) {
            alert('Necesitas estar registrado como club y tener una ciudad configurada');
            return;
        }

        try {
            await EventoDestacadoService.solicitarDestacarEvento(eventoId, user.clubId, user.ciudad);
            const nuevoMapa = new Map(eventosDestacadosMap);
            nuevoMapa.set(eventoId, EstadoSolicitud.PENDIENTE);
            setEventosDestacadosMap(nuevoMapa);
            alert('Solicitud enviada con éxito. El administrador revisará tu solicitud.');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Error al enviar la solicitud');
        }
    };

    const ahora = new Date();
    const eventosFuturos = eventos.filter((evento: Evento) => {
        const fechaEvento = new Date(evento.fecha);
        return fechaEvento >= ahora;
    });

    const eventosFiltrados = eventosFuturos.filter((evento: Evento) => {
        const lugarBusqueda = filtros.lugar.toLowerCase().trim();

        // Nuevo filtro: solo busca en clubId.ubicacion y club.ubicacion si hay texto
        const lugarCoincide =
            !lugarBusqueda ||
            (evento.clubId?.ubicacion && evento.clubId.ubicacion.toLowerCase() === lugarBusqueda) ||
            (evento.club?.ubicacion && evento.club.ubicacion.toLowerCase() === lugarBusqueda);

        const fechaCoincide = filtros.fecha === "" || evento.fecha.startsWith(filtros.fecha);

        const priceRangeCoincide =
            filtros.priceRanges.length === 0 ||
            filtros.priceRanges.some(selectedRange => {
                const clubPriceRange = evento.clubId?.priceRange ||
                                      evento.club?.priceRange ||
                                      evento.clubId?.priceRangeCalculated ||
                                      evento.club?.priceRangeCalculated ||
                                      evento.clubId?.priceRangeInitial ||
                                      evento.club?.priceRangeInitial;

                if (!clubPriceRange) {
                    return true;
                }

                const coincide = clubPriceRange <= selectedRange;

                return coincide;
            });

        const relevancia = filtros.generos.length > 0 ? calcularRelevanciaGenero(evento) : 1;

        const generoCoincide =
            filtros.generos.length === 0 ||
            relevancia > 0;

        const resultado = lugarCoincide && fechaCoincide && generoCoincide && priceRangeCoincide;

        return resultado;
    }).map((evento: Evento) => ({
        ...evento,
        relevancia: calcularRelevanciaGenero(evento)
    })).sort((a: Evento & {relevancia: number}, b: Evento & {relevancia: number}) => {
        const aRating = a.clubMedia || 0;
        const bRating = b.clubMedia || 0;

        if (orderByRelevanceRef.current && filtros.generos.length > 0) {
            if (Math.abs(bRating - aRating) < 1) {
                if (Math.abs(b.relevancia - a.relevancia) > 0.1) {
                    return b.relevancia - a.relevancia;
                }
            }
        }

        return bRating - aRating;
    });

    const totalPaginas = Math.ceil(eventosFiltrados.length / elementosPorPagina);
    const eventosPaginados = eventosFiltrados.slice((pagina - 1) * elementosPorPagina, pagina * elementosPorPagina);

    const irAPagina = (nuevaPagina: number) => {
        if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
            setPagina(nuevaPagina);
            window.scrollTo(0, 0);
        }
    };

    const manejarCambioFiltros = (nuevosFiltros: FiltroState) => {
        setFiltros(nuevosFiltros);
    };

    async function manejarComprarEntrada(eventoId: string, tipoEntrada: string = "General") {
        try {
            const res = await api.post("/pagos/crear-sesion", {eventoId, tipoEntrada});
            window.location.href = res.data.url;
        } catch (error) {
            alert("Ha ocurrido un error al procesar tu solicitud de compra.");
        }
    }

    return (
        <div className="bg-gradient-to-br from-[#0f1224] to-[#120e29] min-h-screen pt-16">
            <div className="container mx-auto px-4 pt-8 pb-16 max-w-[1200px]">
                <div className="relative z-10 mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold text-center mb-3 neon-fuchsia font-display tracking-tight">
                        Eventos
                    </h1>
                    <div className="w-24 h-1 bg-gradient-to-r from-fuchsia-500 to-purple-800 mx-auto mb-8"></div>
                    <p className="text-center text-gray-300 max-w-2xl mx-auto mb-10">
                        Descubre los mejores eventos y fiestas en tu ciudad
                    </p>
                    <FiltroEventos 
                        filtros={filtros} 
                        onFiltrar={manejarCambioFiltros}
                        onBuscar={manejarBuscar}
                        customGenerosDropdown={true}
                    />
                </div>
                {isLoading ? (
                    <Loader />
                ) : (
                    <>
                        {eventosFiltrados.length === 0 ? (
                            <div className="text-center py-16">
                                <p className="text-white text-xl mb-4">No se encontraron eventos con los filtros seleccionados.</p>
                                <button
                                    onClick={() => setFiltros({
                                        lugar: "",
                                        fecha: "",
                                        generos: [],
                                        orderByRating: true,
                                        priceRanges: []
                                    })}
                                    className="bg-fuchsia-500 text-white px-4 py-2 rounded-md hover:bg-fuchsia-600 transition"
                                >
                                    Limpiar filtros
                                </button>
                            </div>
                        ) : (
                            <>
                                <p className="text-gray-300 mb-6">
                                    Se encontraron <span className="font-bold text-white">{eventosFiltrados.length}</span> eventos
                                </p>
                                <div className="space-y-6">
                                    {eventosPaginados.map(evento => (
                                        <div key={evento._id} className="evento-card-container">
                                            <EventoCard
                                                evento={evento}
                                                isUserLogged={!!user}
                                                onVerDetalles={() => navigate(`/eventos/${evento._id}`)}
                                                onComprar={() => manejarComprarEntrada(evento._id)}
                                                mostrarBotonDestacar={user?.rol === 'club'}
                                                estadoDestacado={eventosDestacadosMap.get(evento._id)}
                                                onDestacar={manejarDestacarEvento}
                                                contadorEventosDestacados={contadorEventosDestacados}
                                            />
                                        </div>
                                    ))}
                                </div>
                                {totalPaginas > 1 && (
                                    <div className="flex justify-center mt-10">
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => irAPagina(pagina - 1)}
                                                disabled={pagina === 1}
                                                className="px-4 py-2 rounded-md bg-purple-900/50 text-white disabled:opacity-50"
                                            >
                                                Anterior
                                            </button>
                                            {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                                                let pageToShow;
                                                if (totalPaginas <= 5) {
                                                    pageToShow = i + 1;
                                                } else {
                                                    let start = Math.max(1, pagina - 2);
                                                    const end = Math.min(totalPaginas, start + 4);
                                                    if (end === totalPaginas) {
                                                        start = Math.max(1, end - 4);
                                                    }
                                                    pageToShow = start + i;
                                                }

                                                return (
                                                    <button
                                                        key={pageToShow}
                                                        onClick={() => irAPagina(pageToShow)}
                                                        className={`px-4 py-2 rounded-md transition-all ${
                                                            pageToShow === pagina
                                                                ? "bg-fuchsia-500 text-white font-bold"
                                                                : "bg-purple-900 text-white hover:bg-purple-800"
                                                        }`}
                                                    >
                                                        {pageToShow}
                                                    </button>
                                                );
                                            })}
                                            <button
                                                onClick={() => irAPagina(pagina + 1)}
                                                disabled={pagina === totalPaginas}
                                                className="px-4 py-2 rounded-md bg-purple-900/50 text-white disabled:opacity-50"
                                            >
                                                Siguiente
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
