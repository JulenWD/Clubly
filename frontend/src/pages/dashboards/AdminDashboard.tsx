import { useEffect, useState, useRef } from "react";
import { useUserContext } from "../../context/userContext";
import { validarDNI, validarNIF } from "../../helpers/validaciones";
import { EstadoSolicitud } from "../../types/EventoDestacado";
import toast from "react-hot-toast";
import { TrendingUp } from "lucide-react";
import { getAuth } from "firebase/auth";

interface UsuarioAdmin {
  _id: string;
  nombre: string;
  email: string;
  rol: "usuario" | "dj" | "propietario" | "club";
  fotoPerfilUrl?: string;
  dni?: string;
  verificado?: boolean;
  ubicacion?: string;
}

interface SolicitudEventoDestacado {
  _id: string;
  eventoId: {
    _id: string;
    nombre: string;
    fecha: string;
  };
  clubId: {
    _id: string;
    nombre: string;
    email: string;
    ubicacion: string;
  };
  ciudad: string;
  estado: EstadoSolicitud;
  createdAt: string;
}

interface EventoDestacado {
  _id: string;
  eventoId: {
    _id: string;
    nombre: string;
    fecha: string;
    hora: string;
    descripcion?: string;
    imagen?: string;
    clubId: {
      nombre: string;
      ubicacion: string;
      direccion: string;
      fotoPerfil?: string;
    };
  };
  fechaAprobacion: string;
  fechaExpiracion: string;
}

interface SolicitudesPorCiudad {
  [ciudad: string]: SolicitudEventoDestacado[];
}

interface EventosDestacadosPorCiudad {
  [ciudad: string]: EventoDestacado[];
}

export default function AdminDashboard() {
  const { api } = useUserContext();
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [djs, setDjs] = useState<UsuarioAdmin[]>([]);
  const [clubs, setClubs] = useState<UsuarioAdmin[]>([]);
  const [solicitudesEventos, setSolicitudesEventos] = useState<SolicitudesPorCiudad>({});
  const [procesando, setProcesando] = useState<string | null>(null);
  const [cargandoSolicitudes, setCargandoSolicitudes] = useState<boolean>(false);
  const [tab, setTab] = useState<"usuarios" | "djs" | "clubs" | "eventosDestacados">("usuarios");
  const fetchInProgress = useRef(false);
  
  const [eventosDestacadosPorCiudad, setEventosDestacadosPorCiudad] = useState<{[ciudad: string]: number}>({});
  const [eventosDestacadosActivos, setEventosDestacadosActivos] = useState<EventosDestacadosPorCiudad>({});
  const [mostrarDestacados, setMostrarDestacados] = useState<{[ciudad: string]: boolean}>({});

  useEffect(() => {
    if (fetchInProgress.current) return;

    async function fetchData() {
      fetchInProgress.current = true;
      const notificationId = toast.loading("Cargando usuarios...");

      try {
        const res = await api.get("/administracion/usuarios");

        const usuariosArray = Array.isArray(res.data.usuarios) ? res.data.usuarios : [];
        const djsArray = Array.isArray(res.data.djs) ? res.data.djs : [];
        const clubsArray = Array.isArray(res.data.clubs) ? res.data.clubs : [];

        setUsuarios(usuariosArray);
        setDjs(djsArray);
        setClubs(clubsArray);

        toast.success("Usuarios cargados correctamente", { id: notificationId });
      } catch (e) {
        toast.error("Error al cargar usuarios", { id: notificationId });

        setUsuarios([]);
        setDjs([]);
        setClubs([]);
      } finally {
        fetchInProgress.current = false;
      }
    }
    fetchData();
  }, [api]);

  const eventosRequestInProgress = useRef(false);

  useEffect(() => {
    const cargarSolicitudesEventosDestacados = async () => {
      if (tab !== "eventosDestacados") return;
      if (eventosRequestInProgress.current) return;

      eventosRequestInProgress.current = true;
      setCargandoSolicitudes(true);
      const notificationId = toast.loading("Cargando solicitudes de eventos destacados...");
      
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        
        if (!user) {
          throw new Error("Usuario no autenticado");
        }
        const token = await user.getIdToken(true);
        
        const response = await api.get('/eventos-destacados/solicitudes', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          timeout: 10000
        });
        
        const data = response.data;
  
        setSolicitudesEventos(data);
        
        const contadoresCiudad: {[ciudad: string]: number} = {};
        const eventosActivos: EventosDestacadosPorCiudad = {};
        const estadoMostrar: {[ciudad: string]: boolean} = {};
        
        for (const ciudad of Object.keys(data)) {
          try {
            const responseCount = await api.get(`/eventos-destacados/contar/${ciudad}`);
            const total = responseCount.data.total;
            contadoresCiudad[ciudad] = total;
            
            if (total > 0) {
              const responseEventos = await api.get(`/eventos-destacados/ciudad/${ciudad}`);
              eventosActivos[ciudad] = responseEventos.data;
              estadoMostrar[ciudad] = false;
            }          } catch (err) {
            contadoresCiudad[ciudad] = 0;
          }
        }
        
        setEventosDestacadosPorCiudad(contadoresCiudad);
        setEventosDestacadosActivos(eventosActivos);
        setMostrarDestacados(estadoMostrar);
        
        toast.success("Solicitudes cargadas correctamente", { id: notificationId });      } catch (error: any) {        let mensaje = "Error al cargar solicitudes de eventos destacados";
        
        if (error.response) {
          mensaje = error.response.data?.message || `Error ${error.response.status}: ${error.response.statusText}`;
            if (error.response.status === 403) {
            mensaje = "No tienes permisos para acceder a esta funcionalidad. Verifica que tu usuario tiene rol de administrador.";
            
            try {
              const auth = getAuth();
              if (auth.currentUser) {                await auth.currentUser.getIdToken(true);
                mensaje += " (Token renovado, intenta de nuevo)";
              }            } catch (e) {
            }
          }
        } else if (error.request) {          mensaje = "No se recibió respuesta del servidor. Comprueba tu conexión a internet.";
        } else {
          mensaje = error.message || mensaje;
        }
        
        toast.error(mensaje, { id: notificationId, duration: 6000 });
        setSolicitudesEventos({});
        setEventosDestacadosPorCiudad({});
        setEventosDestacadosActivos({});
      } finally {
        setCargandoSolicitudes(false);
        eventosRequestInProgress.current = false;
      }
    };

    cargarSolicitudesEventosDestacados();
  }, [tab, api]);

  const handleVerificar = async (id: string, rol: string, verificar: boolean) => {
    try {

      const notificationId = toast.loading(
        `${verificar ? "Verificando" : "Rechazando"} ${rol === "propietario" || rol === "club" ? "club" : rol}...`
      );
      
      await api.patch(`/administracion/usuarios/${id}/verificar`, { verificado: verificar });

      if (rol === "usuario") setUsuarios((u) => u.filter((x) => x._id !== id));
      if (rol === "dj") setDjs((d) => d.filter((x) => x._id !== id));
      if (rol === "propietario" || rol === "club") setClubs((c) => c.filter((x) => x._id !== id));

      toast.success(
        `${rol === "propietario" || rol === "club" ? "Club" : rol === "dj" ? "DJ" : "Usuario"} ${
          verificar ? "verificado" : "rechazado"
        } correctamente`,
        { id: notificationId }
      );    } catch (error) {
      toast.error(`Error al ${verificar ? "verificar" : "rechazar"} ${rol}`);
    }
  };
  const handleAprobarSolicitud = async (solicitudId: string) => {
    setProcesando(solicitudId);
    try {
      let ciudadSolicitud = '';
      let solicitudAprobada: SolicitudEventoDestacado | null = null;
      
      Object.entries(solicitudesEventos).forEach(([ciudad, solicitudes]) => {
        const solicitud = solicitudes.find(s => s._id === solicitudId);
        if (solicitud) {
          ciudadSolicitud = ciudad;
          solicitudAprobada = solicitud;
        }
      });
      
      if (!ciudadSolicitud || !solicitudAprobada) {
        throw new Error('No se encontró la solicitud a aprobar');
      }
      
      if ((eventosDestacadosPorCiudad[ciudadSolicitud] || 0) >= 3) {
        toast.error(`La ciudad ${ciudadSolicitud} ya tiene 3 eventos destacados activos`);
        return;
      }
      
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error("Usuario no autenticado");
      }
      
      const token = await user.getIdToken(true);
      
      await api.put(`/eventos-destacados/aprobar/${solicitudId}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        }
      });
      
      toast.success("Solicitud aprobada correctamente");
      
      setEventosDestacadosPorCiudad(prev => ({
        ...prev,
        [ciudadSolicitud]: (prev[ciudadSolicitud] || 0) + 1
      }));
      
      const responseActualizado = await api.get(`/eventos-destacados/ciudad/${ciudadSolicitud}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        }
      });
      
      setEventosDestacadosActivos(prev => ({
        ...prev,
        [ciudadSolicitud]: responseActualizado.data
      }));

      setSolicitudesEventos((prev) => {
        const newState = { ...prev };

        Object.keys(newState).forEach((ciudad) => {
          newState[ciudad] = newState[ciudad].filter((sol) => sol._id !== solicitudId);

          if (newState[ciudad].length === 0) {
            delete newState[ciudad];
          }
        });

        return newState;
      });    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al aprobar la solicitud");
    } finally {
      setProcesando(null);
    }
  };
  const handleDenegarSolicitud = async (solicitudId: string) => {
    setProcesando(solicitudId);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error("Usuario no autenticado");
      }
      
      const token = await user.getIdToken(true);
      
      await api.put(`/eventos-destacados/denegar/${solicitudId}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        }
      });
      
      toast.success("Solicitud denegada correctamente");

      setSolicitudesEventos((prev) => {
        const newState = { ...prev };

        Object.keys(newState).forEach((ciudad) => {
          newState[ciudad] = newState[ciudad].filter((sol) => sol._id !== solicitudId);

          if (newState[ciudad].length === 0) {
            delete newState[ciudad];
          }
        });

        return newState;
      });    } catch (error) {
      toast.error("Error al denegar la solicitud");
    } finally {
      setProcesando(null);
    }
  };

  const toggleMostrarDestacados = (ciudad: string) => {
    setMostrarDestacados(prev => ({
      ...prev,
      [ciudad]: !prev[ciudad]
    }));
  };

  const renderCard = (user: UsuarioAdmin) => {
    let validacion = "-";
    let isValid = false;

    if (user.rol === "usuario" || user.rol === "dj") {
      isValid = user.dni ? validarDNI(user.dni) : false;
      validacion = user.dni ? (isValid ? "DNI válido" : "DNI inválido") : "Sin DNI";
    } else if (user.rol === "propietario" || user.rol === "club") {
      isValid = user.dni ? validarNIF(user.dni) : false;
      validacion = user.dni ? (isValid ? "NIF válido" : "NIF inválido") : "Sin NIF";
    }

    const isVerified = !!user.verificado;
    return (
      <div
        key={user._id}
        className={`flex items-center gap-4 p-4 border rounded mb-2 bg-white ${
          isVerified
            ? "border-green-500"
            : user.rol === "propietario" || user.rol === "club"
            ? "border-purple-200"
            : ""
        }`}
      >
        <img
          src={user.fotoPerfilUrl || "/placeholder.jpg"}
          alt="perfil"
          className="w-12 h-12 rounded-full object-cover"
        />
        <div className="flex-1">
          <div className="font-bold flex items-center gap-1">
            {user.nombre}
            {isVerified && (
              <span className="text-green-500 text-xs ml-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 inline"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Verificado
              </span>
            )}
            {(user.rol === "propietario" || user.rol === "club") && (
              <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded ml-2">
                Club
              </span>
            )}
          </div>
          <div className="text-sm text-gray-600">{user.email}</div>

          {(user.rol === "propietario" || user.rol === "club") && user.ubicacion && (
            <div className="text-xs text-gray-500 mt-1">
              <span className="font-medium">Ubicación:</span> {user.ubicacion}
            </div>
          )}

          <div className="text-xs text-gray-500 mt-1">
            {user.rol === "propietario" || user.rol === "club" ? "NIF" : "DNI"}:{" "}
            {user.dni || "-"}
          </div>
          <div className="text-xs">
            Validación:{" "}
            <span
              className={
                validacion.includes("válido") ? "text-green-600" : "text-red-600"
              }
            >
              {validacion}
            </span>
            {user.verificado === false && (
              <span className="ml-2 text-orange-500 font-medium">
                (Pendiente de verificación)
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => handleVerificar(user._id, user.rol, true)}
            className="bg-green-500 text-white rounded-md p-2 hover:bg-green-600 transition-colors text-sm flex items-center justify-center"
            disabled={isVerified}
            title={isVerified ? "Ya verificado" : "Verificar"}
          >
            <span className="block sm:hidden md:block">Verificar</span>
            <span className="hidden sm:block md:hidden">✔</span>
          </button>
          <button
            onClick={() => handleVerificar(user._id, user.rol, false)}
            className="bg-red-500 text-white rounded-md p-2 hover:bg-red-600 transition-colors text-sm flex items-center justify-center"
          >
            <span className="block sm:hidden md:block">Rechazar</span>
            <span className="hidden sm:block md:hidden">✖</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">Panel de Administración</h1>
      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={() => setTab("usuarios")}
          className={`px-3 py-1 rounded-md ${
            tab === "usuarios" ? "bg-purple-600 text-white" : "text-purple-600"
          }`}
        >
          Usuarios
        </button>
        <button
          onClick={() => setTab("djs")}
          className={`px-3 py-1 rounded-md ${
            tab === "djs" ? "bg-purple-600 text-white" : "text-purple-600"
          }`}
        >
          DJs
        </button>
        <button
          onClick={() => setTab("clubs")}
          className={`px-3 py-1 rounded-md ${
            tab === "clubs" ? "bg-purple-600 text-white" : "text-purple-600"
          }`}
        >
          Clubs
        </button>
        <button
          onClick={() => setTab("eventosDestacados")}
          className={`px-3 py-1 rounded-md ${
            tab === "eventosDestacados"
              ? "bg-purple-600 text-white"
              : "text-purple-600"
          }`}
        >
          Eventos Destacados
        </button>
      </div>
      <div>
        {tab === "usuarios" && (usuarios || []).map(renderCard)}
        {tab === "djs" && (djs || []).map(renderCard)}
        {tab === "clubs" && (clubs || []).map(renderCard)}
        {tab === "usuarios" && usuarios.length === 0 && (
          <p className="text-center text-gray-400">No hay usuarios pendientes.</p>
        )}
        {tab === "djs" && djs.length === 0 && (
          <p className="text-center text-gray-400">No hay DJs pendientes.</p>
        )}
        {tab === "clubs" && clubs.length === 0 && (
          <p className="text-center text-gray-400">No hay clubs pendientes.</p>
        )}

        {tab === "eventosDestacados" && (
          <div className="mt-4">
            <h2 className="text-xl font-semibold mb-4">
              Solicitudes de Eventos Destacados
            </h2>

            {cargandoSolicitudes ? (
              <div className="flex justify-center items-center p-8">
                <div className="w-8 h-8 border-t-2 border-b-2 border-purple-500 rounded-full animate-spin"></div>
              </div>
            ) : Object.keys(solicitudesEventos).length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-6 text-center shadow">
                <p className="text-gray-500">
                  No hay solicitudes pendientes de revisión
                </p>
              </div>
            ) : (
              Object.entries(solicitudesEventos).map(
                ([ciudad, solicitudesCiudad]) => (
                  <div key={ciudad} className="mb-8">
                    <h3 className="text-lg font-medium mb-2 border-b pb-1">
                      {ciudad}{" "}
                      <span className="text-sm font-normal text-gray-500">
                        ({solicitudesCiudad.length} solicitudes)
                      </span>
                    </h3>
                    
                    <div className="flex items-center mb-3 bg-gray-100 p-2 rounded-md">
                      <div className={`text-sm rounded-full px-3 py-1 ${
                        (eventosDestacadosPorCiudad[ciudad] || 0) >= 3 ? 'bg-red-600/50 text-white' : 'bg-emerald-600/50 text-white'
                      }`}>
                        {(eventosDestacadosPorCiudad[ciudad] || 0)}/3 eventos destacados actualmente
                      </div>
                      <p className="ml-3 text-sm text-gray-600">
                        {(eventosDestacadosPorCiudad[ciudad] || 0) >= 3 
                          ? 'Esta ciudad ha alcanzado el límite de eventos destacados' 
                          : `Pueden aprobarse ${3 - (eventosDestacadosPorCiudad[ciudad] || 0)} solicitud(es) más`}
                      </p>
                      
                      {eventosDestacadosActivos[ciudad] && eventosDestacadosActivos[ciudad].length > 0 && (
                        <button 
                          onClick={() => toggleMostrarDestacados(ciudad)} 
                          className="ml-auto text-sm bg-purple-600/50 hover:bg-purple-600 text-white rounded-md px-3 py-1 transition-colors flex items-center"
                        >
                          <TrendingUp className="w-4 h-4 mr-1" />
                          {mostrarDestacados[ciudad] ? 'Ocultar destacados' : 'Ver destacados'}
                        </button>
                      )}
                    </div>
                    
                    {eventosDestacadosActivos[ciudad] && eventosDestacadosActivos[ciudad].length > 0 && mostrarDestacados[ciudad] && (
                      <div className="mb-4 p-3 bg-purple-100 border border-purple-200 rounded-lg">
                        <h4 className="text-sm font-medium text-purple-700 mb-2 flex items-center">
                          <TrendingUp className="w-4 h-4 mr-1 text-purple-600" />
                          Eventos destacados actuales
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {eventosDestacadosActivos[ciudad].map(evento => (
                            <div key={evento._id} className="bg-white p-3 rounded-lg border border-purple-200 shadow-sm">
                              <h5 className="font-medium text-gray-800">{evento.eventoId.nombre}</h5>
                              <p className="text-xs text-purple-700">Club: {evento.eventoId.clubId.nombre}</p>
                              <p className="text-xs text-gray-500">
                                Fecha: {new Date(evento.eventoId.fecha).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Expira: {new Date(evento.fechaExpiracion).toLocaleDateString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      {solicitudesCiudad.map((solicitud) => (
                        <div
                          key={solicitud._id}
                          className="bg-white p-4 rounded-lg shadow border border-gray-200"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-grow">
                              <h4 className="font-bold">
                                {solicitud.eventoId.nombre}
                              </h4>
                              <p className="text-sm text-gray-600">
                                Club: {solicitud.clubId.nombre}
                              </p>
                              <p className="text-xs text-gray-500">
                                Fecha evento:{" "}
                                {new Date(
                                  solicitud.eventoId.fecha
                                ).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-gray-400">
                                Solicitud recibida:{" "}
                                {new Date(solicitud.createdAt).toLocaleString()}
                              </p>
                            </div>

                            <div className="flex space-x-2">
                              <button
                                onClick={() =>
                                  handleAprobarSolicitud(solicitud._id)
                                }
                                disabled={procesando === solicitud._id || (eventosDestacadosPorCiudad[ciudad] || 0) >= 3}
                                className={`${
                                  (eventosDestacadosPorCiudad[ciudad] || 0) >= 3 
                                    ? 'bg-gray-500 cursor-not-allowed' 
                                    : 'bg-green-500 hover:bg-green-600'
                                } text-white py-1 px-3 rounded-md text-sm transition-colors disabled:opacity-70`}
                                title={(eventosDestacadosPorCiudad[ciudad] || 0) >= 3 ? 'Esta ciudad ya tiene 3 eventos destacados' : ''}
                              >
                                {procesando === solicitud._id
                                  ? "Procesando..."
                                  : "Aprobar"}
                              </button>
                              <button
                                onClick={() =>
                                  handleDenegarSolicitud(solicitud._id)
                                }
                                disabled={procesando === solicitud._id}
                                className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded-md text-sm disabled:opacity-70"
                              >
                                {procesando === solicitud._id
                                  ? "Procesando..."
                                  : "Denegar"}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
