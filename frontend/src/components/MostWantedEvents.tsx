import { Icon } from '@iconify/react';
import { useState, useEffect } from 'react';
import { useNavigate, NavigateFunction } from 'react-router-dom';
import axios from 'axios';
import { EventoExtendido } from '../types/EventoExtendido';
// EntradaExtendida is used indirectly through EventoExtendido
import { useUserContext } from '../context/userContext';
import authAxios from '../helpers/authAxios';

// Array con posiciones estáticas predefinidas para los iconos de fuego
// Cada objeto representa un icono con sus propiedades de posición y estilo
const FIRE_ICONS = [
  // Primera fila (parte inferior)
  { id: 1, size: 95, rotate: -12, left: "3%", bottom: "-5%", opacity: 0.4, color: '#ff00ea', zIndex: 0 },
  { id: 2, size: 105, rotate: 8, left: "12%", bottom: "-8%", opacity: 0.35, color: '#00eaff', zIndex: -1 },
  { id: 3, size: 90, rotate: -5, left: "19%", bottom: "-3%", opacity: 0.32, color: '#39ff14', zIndex: 0 },
  { id: 4, size: 110, rotate: 15, left: "26%", bottom: "-6%", opacity: 0.38, color: '#fff700', zIndex: -1 },
  { id: 5, size: 85, rotate: -10, left: "33%", bottom: "-4%", opacity: 0.42, color: '#ff5e00', zIndex: 0 },
  { id: 6, size: 100, rotate: 5, left: "40%", bottom: "-7%", opacity: 0.36, color: '#a21caf', zIndex: -1 },
  { id: 7, size: 92, rotate: -8, left: "47%", bottom: "-5%", opacity: 0.4, color: '#00eaff', zIndex: 0 },
  { id: 8, size: 105, rotate: 12, left: "54%", bottom: "-8%", opacity: 0.38, color: '#ff00ea', zIndex: -1 },
  { id: 9, size: 88, rotate: -15, left: "61%", bottom: "-4%", opacity: 0.35, color: '#39ff14', zIndex: 0 },
  { id: 10, size: 102, rotate: 7, left: "68%", bottom: "-7%", opacity: 0.37, color: '#fff700', zIndex: -1 },
  { id: 11, size: 94, rotate: -11, left: "75%", bottom: "-5%", opacity: 0.41, color: '#ff5e00', zIndex: 0 },
  { id: 12, size: 108, rotate: 14, left: "82%", bottom: "-8%", opacity: 0.36, color: '#a21caf', zIndex: -1 },
  { id: 13, size: 87, rotate: -6, left: "89%", bottom: "-3%", opacity: 0.34, color: '#00eaff', zIndex: 0 },
  { id: 14, size: 96, rotate: 9, left: "96%", bottom: "-6%", opacity: 0.39, color: '#ff00ea', zIndex: -1 },
  
  // Segunda fila (ligeramente más arriba, más densidad)
  { id: 15, size: 95, rotate: 10, left: "5%", bottom: "5%", opacity: 0.3, color: '#ff5e00', zIndex: -1 },
  { id: 16, size: 85, rotate: -12, left: "11%", bottom: "3%", opacity: 0.32, color: '#a21caf', zIndex: 0 },
  { id: 17, size: 100, rotate: 8, left: "17%", bottom: "4%", opacity: 0.28, color: '#00eaff', zIndex: -1 },
  { id: 18, size: 90, rotate: -5, left: "24%", bottom: "6%", opacity: 0.33, color: '#ff00ea', zIndex: 0 },
  { id: 19, size: 102, rotate: 15, left: "31%", bottom: "3%", opacity: 0.29, color: '#39ff14', zIndex: -1 },
  { id: 20, size: 87, rotate: -10, left: "38%", bottom: "5%", opacity: 0.34, color: '#fff700', zIndex: 0 },
  { id: 21, size: 98, rotate: 5, left: "45%", bottom: "2%", opacity: 0.31, color: '#ff5e00', zIndex: -1 },
  { id: 22, size: 92, rotate: -8, left: "52%", bottom: "4%", opacity: 0.27, color: '#a21caf', zIndex: 0 },
  { id: 23, size: 104, rotate: 13, left: "59%", bottom: "3%", opacity: 0.3, color: '#00eaff', zIndex: -1 },
  { id: 24, size: 89, rotate: -7, left: "66%", bottom: "5%", opacity: 0.32, color: '#ff00ea', zIndex: 0 },
  { id: 25, size: 101, rotate: 9, left: "73%", bottom: "2%", opacity: 0.29, color: '#39ff14', zIndex: -1 },
  { id: 26, size: 86, rotate: -13, left: "80%", bottom: "4%", opacity: 0.33, color: '#fff700', zIndex: 0 },
  { id: 27, size: 97, rotate: 6, left: "87%", bottom: "3%", opacity: 0.3, color: '#ff5e00', zIndex: -1 },
  { id: 28, size: 93, rotate: -9, left: "94%", bottom: "5%", opacity: 0.31, color: '#a21caf', zIndex: 0 },
  
  // Tercera fila (dispersa pero más densa)
  { id: 29, size: 80, rotate: 12, left: "4%", bottom: "12%", opacity: 0.25, color: '#00eaff', zIndex: -1 },
  { id: 30, size: 95, rotate: -15, left: "10%", bottom: "15%", opacity: 0.22, color: '#ff00ea', zIndex: 0 },
  { id: 31, size: 85, rotate: 10, left: "16%", bottom: "10%", opacity: 0.26, color: '#39ff14', zIndex: -1 },
  { id: 32, size: 90, rotate: -5, left: "22%", bottom: "13%", opacity: 0.23, color: '#fff700', zIndex: 0 },
  { id: 33, size: 82, rotate: 8, left: "28%", bottom: "11%", opacity: 0.24, color: '#ff5e00', zIndex: -1 },
  { id: 34, size: 88, rotate: -12, left: "34%", bottom: "14%", opacity: 0.21, color: '#a21caf', zIndex: 0 },
  { id: 35, size: 83, rotate: 11, left: "40%", bottom: "12%", opacity: 0.23, color: '#00eaff', zIndex: -1 },
  { id: 36, size: 93, rotate: -7, left: "46%", bottom: "15%", opacity: 0.2, color: '#ff00ea', zIndex: 0 },
  { id: 37, size: 81, rotate: 13, left: "52%", bottom: "10%", opacity: 0.25, color: '#39ff14', zIndex: -1 },
  { id: 38, size: 91, rotate: -9, left: "58%", bottom: "13%", opacity: 0.22, color: '#fff700', zIndex: 0 },
  { id: 39, size: 84, rotate: 7, left: "64%", bottom: "11%", opacity: 0.24, color: '#ff5e00', zIndex: -1 },
  { id: 40, size: 89, rotate: -14, left: "70%", bottom: "14%", opacity: 0.21, color: '#a21caf', zIndex: 0 },
  { id: 41, size: 86, rotate: 9, left: "76%", bottom: "12%", opacity: 0.23, color: '#00eaff', zIndex: -1 },
  { id: 42, size: 94, rotate: -6, left: "82%", bottom: "15%", opacity: 0.2, color: '#ff00ea', zIndex: 0 },
  { id: 43, size: 80, rotate: 14, left: "88%", bottom: "10%", opacity: 0.25, color: '#39ff14', zIndex: -1 },
  { id: 44, size: 92, rotate: -8, left: "94%", bottom: "13%", opacity: 0.22, color: '#fff700', zIndex: 0 },
  
  // Cuarta fila (más arriba y dispersa)
  { id: 45, size: 75, rotate: 15, left: "7%", bottom: "20%", opacity: 0.2, color: '#00eaff', zIndex: -1 },
  { id: 46, size: 80, rotate: -10, left: "15%", bottom: "22%", opacity: 0.18, color: '#ff00ea', zIndex: 0 },
  { id: 47, size: 70, rotate: 5, left: "23%", bottom: "18%", opacity: 0.22, color: '#39ff14', zIndex: -1 },
  { id: 48, size: 78, rotate: -8, left: "31%", bottom: "23%", opacity: 0.19, color: '#fff700', zIndex: 0 },
  { id: 49, size: 73, rotate: 12, left: "39%", bottom: "19%", opacity: 0.21, color: '#ff5e00', zIndex: -1 },
  { id: 50, size: 79, rotate: -13, left: "47%", bottom: "21%", opacity: 0.17, color: '#a21caf', zIndex: 0 },
  { id: 51, size: 72, rotate: 7, left: "55%", bottom: "18%", opacity: 0.2, color: '#00eaff', zIndex: -1 },
  { id: 52, size: 77, rotate: -9, left: "63%", bottom: "22%", opacity: 0.18, color: '#ff00ea', zIndex: 0 },
  { id: 53, size: 71, rotate: 14, left: "71%", bottom: "19%", opacity: 0.21, color: '#39ff14', zIndex: -1 },
  { id: 54, size: 76, rotate: -7, left: "79%", bottom: "23%", opacity: 0.19, color: '#fff700', zIndex: 0 },
  { id: 55, size: 74, rotate: 11, left: "87%", bottom: "20%", opacity: 0.2, color: '#ff5e00', zIndex: -1 },
  { id: 56, size: 79, rotate: -12, left: "95%", bottom: "22%", opacity: 0.17, color: '#a21caf', zIndex: 0 },
  
  // Quinta fila (cerca de la mitad, más sutiles)
  { id: 57, size: 65, rotate: 12, left: "6%", bottom: "30%", opacity: 0.15, color: '#ff5e00', zIndex: -1 },
  { id: 58, size: 70, rotate: -15, left: "14%", bottom: "28%", opacity: 0.17, color: '#a21caf', zIndex: 0 },
  { id: 59, size: 60, rotate: 8, left: "22%", bottom: "32%", opacity: 0.14, color: '#00eaff', zIndex: -1 },
  { id: 60, size: 68, rotate: -5, left: "30%", bottom: "29%", opacity: 0.16, color: '#ff00ea', zIndex: 0 },
  { id: 61, size: 63, rotate: 13, left: "38%", bottom: "31%", opacity: 0.13, color: '#39ff14', zIndex: -1 },
  { id: 62, size: 69, rotate: -11, left: "46%", bottom: "27%", opacity: 0.16, color: '#fff700', zIndex: 0 },
  { id: 63, size: 62, rotate: 9, left: "54%", bottom: "30%", opacity: 0.14, color: '#ff5e00', zIndex: -1 },
  { id: 64, size: 67, rotate: -7, left: "62%", bottom: "28%", opacity: 0.15, color: '#a21caf', zIndex: 0 },
  { id: 65, size: 61, rotate: 14, left: "70%", bottom: "31%", opacity: 0.13, color: '#00eaff', zIndex: -1 },
  { id: 66, size: 66, rotate: -8, left: "78%", bottom: "29%", opacity: 0.16, color: '#ff00ea', zIndex: 0 },
  { id: 67, size: 64, rotate: 10, left: "86%", bottom: "32%", opacity: 0.14, color: '#39ff14', zIndex: -1 },
  { id: 68, size: 69, rotate: -13, left: "94%", bottom: "27%", opacity: 0.15, color: '#fff700', zIndex: 0 },
  
  // Sexta fila (más arriba y muy sutil)
  { id: 69, size: 55, rotate: 10, left: "10%", bottom: "38%", opacity: 0.12, color: '#39ff14', zIndex: -1 },
  { id: 70, size: 60, rotate: -8, left: "20%", bottom: "35%", opacity: 0.13, color: '#fff700', zIndex: 0 },
  { id: 71, size: 50, rotate: 5, left: "30%", bottom: "40%", opacity: 0.11, color: '#ff5e00', zIndex: -1 },
  { id: 72, size: 58, rotate: -12, left: "40%", bottom: "42%", opacity: 0.1, color: '#a21caf', zIndex: 0 },
  { id: 73, size: 52, rotate: 13, left: "50%", bottom: "37%", opacity: 0.13, color: '#00eaff', zIndex: -1 },
  { id: 74, size: 59, rotate: -7, left: "60%", bottom: "41%", opacity: 0.1, color: '#ff00ea', zIndex: 0 },
  { id: 75, size: 51, rotate: 11, left: "70%", bottom: "36%", opacity: 0.12, color: '#39ff14', zIndex: -1 },
  { id: 76, size: 56, rotate: -9, left: "80%", bottom: "39%", opacity: 0.11, color: '#fff700', zIndex: 0 },
  { id: 77, size: 54, rotate: 6, left: "90%", bottom: "43%", opacity: 0.09, color: '#ff5e00', zIndex: -1 },
  
  // Siluetas muy sutiles en la parte superior
  { id: 78, size: 45, rotate: 15, left: "15%", bottom: "48%", opacity: 0.08, color: '#00eaff', zIndex: -1 },
  { id: 79, size: 48, rotate: -14, left: "35%", bottom: "47%", opacity: 0.07, color: '#ff00ea', zIndex: 0 },
  { id: 80, size: 42, rotate: 12, left: "55%", bottom: "50%", opacity: 0.08, color: '#39ff14', zIndex: -1 },
  { id: 81, size: 47, rotate: -10, left: "75%", bottom: "49%", opacity: 0.06, color: '#fff700', zIndex: 0 },
];

// Rotaciones definidas para las tarjetas, ligeras pero consistentes
const CARD_ROTATIONS = [-1.2, 0.8, -0.9];

// Función auxiliar para navegar con logging para debugging
const navigateWithLogging = (navigate: NavigateFunction, path: string, eventId?: string): void => {
  console.log(`Navegando a: ${path} (Evento ID: ${eventId || 'no disponible'})`);
  navigate(path);
};

// Función auxiliar para verificar si un evento tiene todas las entradas agotadas
const isEventoAgotado = (evento: EventoExtendido): boolean => {
  if (!evento.entradas || !Array.isArray(evento.entradas) || evento.entradas.length === 0) {
    return false;
  }

  const ventasPorTipo = evento.ventasPorTipo || {};
  
  return evento.entradas.every((entrada: any) => {
    if (!entrada) return true;
    
    // Verificar si hay datos de ventas para este tipo de entrada
    const vendidas = ventasPorTipo[entrada.tipo] || 0;
    
    // Si tiene aforo total definido, verificar si se superó
    if (entrada.aforoTotal !== undefined) {
      return vendidas >= entrada.aforoTotal;
    }
    
    // Si tiene tramos, verificar si todos están agotados
    if (entrada.tramos && Array.isArray(entrada.tramos) && entrada.tramos.length > 0) {
      return entrada.tramos.every((tramo: any) => {
        if (tramo.cantidadDisponible !== undefined && tramo.entradasVendidas !== undefined) {
          return tramo.entradasVendidas >= tramo.cantidadDisponible;
        }
        // Si no tiene datos de cantidades, verificar por el límite "hasta"
        return vendidas >= (tramo.hasta || 0);
      });
    }
    
    return false;
  });
};

export default function MostWantedEvents(): React.ReactElement {
  // Usamos el tipo extendido para manejar posibles propiedades adicionales que envíe el backend
  const [eventos, setEventos] = useState<EventoExtendido[]>([]);
  const [eventosActualizados, setEventosActualizados] = useState<Record<string, EventoExtendido>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [ciudad, setCiudad] = useState<string>('');
  const { user } = useUserContext();
  const navigate = useNavigate();

  // Obtener la ciudad del usuario del localStorage o del perfil
  useEffect(() => {
    const ciudadGuardada = localStorage.getItem('clubly_ciudad_usuario');
    
    if (ciudadGuardada) {
      // Lista de regiones que deben tratarse de forma especial
      const regiones = ['Cantabria', 'Asturias', 'La Rioja', 'Navarra'];
      
      if (regiones.includes(ciudadGuardada)) {
        // Para regiones, usar la capital o ciudad principal
        const ciudadesPrincipales: Record<string, string> = {
          'Cantabria': 'Santander',
          'Asturias': 'Oviedo',
          'La Rioja': 'Logroño',
          'Navarra': 'Pamplona'
        };
        
        setCiudad(ciudadesPrincipales[ciudadGuardada]);
      } else {
        setCiudad(ciudadGuardada);
      }
    } else if (user && (user.ciudad || user.ubicacion)) {
      // Usar ubicacion si ciudad no está disponible
      const ubicacionUsuario = user.ciudad || user.ubicacion || '';
      
      // Lista de regiones que deben tratarse de forma especial
      const regiones = ['Cantabria', 'Asturias', 'La Rioja', 'Navarra'];
      
      if (ubicacionUsuario && regiones.includes(ubicacionUsuario)) {
        // Para regiones, usar la capital o ciudad principal
        const ciudadesPrincipales: Record<string, string> = {
          'Cantabria': 'Santander',
          'Asturias': 'Oviedo',
          'La Rioja': 'Logroño',
          'Navarra': 'Pamplona'
        };
        
        setCiudad(ciudadesPrincipales[ubicacionUsuario]);
      } else {
        setCiudad(ubicacionUsuario);
      }
      
      if (ubicacionUsuario) {
        localStorage.setItem('clubly_ciudad_usuario', ubicacionUsuario);
      }
    }
  }, [user]);
  // Cargar eventos destacados por ciudad
  useEffect(() => {
    async function cargarEventosDestacados() {
      // Si no hay ciudad, no cargar eventos y detener el loading
      if (!ciudad) {
        setLoading(false);
        setEventos([]);
        return;
      }
      
      setLoading(true);
      try {
        // Usamos un manejo más detallado del logging para debugging
        console.log(`Cargando eventos destacados para: ${ciudad}`);
        
        // Codificar la ciudad para la URL (manejo de espacios y caracteres especiales)
        const ciudadEncoded = encodeURIComponent(ciudad);
        
        // Usar authAxios si hay usuario autenticado, sino axios normal
        const api = user ? authAxios : axios;
        
        // Usar el baseURL correcto para la petición
        const apiUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
        const response = await api.get(`${apiUrl}/eventos-destacados/ciudad/${ciudadEncoded}`);
        
        console.log('Respuesta del backend eventos destacados:', response.data);
        
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          // Asegurar que tenemos todos los datos necesarios antes de mostrar
          const eventosConDatos = response.data
            .filter((evento: any) => evento && evento._id && evento.nombre && evento.fecha)
            .slice(0, 3);
            // Imprimir datos detallados para debugging
          console.log(`Eventos destacados cargados: ${eventosConDatos.length}`);
          eventosConDatos.forEach((evento, idx) => {
            console.log(`Evento ${idx + 1}: ${evento.nombre} (ID: ${evento._id})`);
            console.log(`- Tiene ventasPorTipo: ${evento.ventasPorTipo ? 'Sí' : 'No'}`);
            if (evento.ventasPorTipo) {
              console.log(`- ventasPorTipo:`, evento.ventasPorTipo);
            }
            console.log(`- Tiene entradas: ${evento.entradas ? 'Sí (' + evento.entradas.length + ')' : 'No'}`);
            if (evento.entradas) {
              evento.entradas.forEach((entrada: any, i: number) => {
                console.log(`  - Entrada ${i + 1}: ${entrada.tipo}`);
                console.log(`    - precio: ${entrada.precio}`);
                console.log(`    - aforoTotal: ${entrada.aforoTotal}`);
                console.log(`    - entradasVendidas: ${entrada.entradasVendidas}`);                console.log(`    - Tiene tramos: ${entrada.tramos ? 'Sí (' + entrada.tramos.length + ')' : 'No'}`);
                if (entrada.tramos) {
                  entrada.tramos.forEach((tramo: any, t: number) => {
                    console.log(`      - Tramo ${t + 1}: hasta ${tramo.hasta}, precio ${tramo.precio}`);
                    console.log(`        cantidadVendida: ${tramo.cantidadVendida}, cantidadDisponible: ${tramo.cantidadDisponible}`);
                  });
                }
              });
            }
          });
          
          setEventos(eventosConDatos);
        } else {
          // Asegurarnos de que siempre tenemos un array vacío si no hay datos
          console.log('No se encontraron eventos destacados para esta ciudad');
          setEventos([]);
        }
        setError(null);
      } catch (err) {
        console.error(`Error al cargar eventos destacados para ${ciudad}:`, err);
        setError('No se pudieron cargar los eventos destacados');
        // Garantizar que eventos siempre sea un array
        setEventos([]);
      } finally {
        setLoading(false);
      }
    }

    cargarEventosDestacados();
  }, [ciudad, user]);

  // Nuevo efecto para cargar los detalles actualizados de cada evento después de la carga inicial
  useEffect(() => {
    // Solo proceder si tenemos eventos y no estamos en estado de carga inicial
    if (eventos.length === 0 || loading) {
      return;
    }

    const fetchEventosActualizados = async () => {
      // Usar authAxios si hay usuario autenticado, sino axios normal
      const api = user ? authAxios : axios;
      
      // Usar el baseURL correcto para la petición
      const apiUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      
      // Crear un objeto para almacenar los eventos actualizados
      const eventosMap: Record<string, EventoExtendido> = {};
      
      // Para cada evento, obtener los detalles actualizados
      for (const evento of eventos) {
        try {
          // Usar la misma ruta que EventoDetalle para obtener información actualizada
          const res = await api.get(`${apiUrl}/eventos/${evento._id}`);
          if (res.data) {
            // Guardar el evento actualizado en el objeto usando su ID como clave
            eventosMap[evento._id] = res.data;
          }
        } catch (err) {
          console.error(`Error al actualizar datos del evento ${evento._id}:`, err);
          // Si hay error, mantener el evento original
          eventosMap[evento._id] = evento;
        }
      }
      
      // Actualizar el estado con los eventos actualizados
      setEventosActualizados(eventosMap);
    };
    
    fetchEventosActualizados();
  }, [eventos, loading, user]);  // Función para obtener los datos más actualizados de un evento
  const getEventoActualizado = (evento: EventoExtendido): EventoExtendido => {
    if (eventosActualizados[evento._id]) {
      // Log para depuración
      console.log(`Datos actualizados para evento ${evento._id} (${evento.nombre}):`);
      console.log('- Ventas por tipo:', eventosActualizados[evento._id].ventasPorTipo);
      console.log('- Entradas:', eventosActualizados[evento._id].entradas);
      
      // Verificación de datos detallada
      const ventasPorTipo = eventosActualizados[evento._id].ventasPorTipo || {};
      const entradas = eventosActualizados[evento._id].entradas || [];
      
      entradas.forEach((entrada, i) => {
        console.log(`Entrada ${i+1} (${entrada.tipo}):`, {
          'aforoTotal': entrada.aforoTotal,
          'vendidas': ventasPorTipo[entrada.tipo] || 0,
          'tiene_tramos': entrada.tramos && entrada.tramos.length > 0,
          'tramos': entrada.tramos?.map(t => ({
            'hasta': t.hasta,
            'precio': t.precio,
            'disponible': t.cantidadDisponible,
            'vendido': t.entradasVendidas
          }))
        });
      });
      
      // Comprobar disponibilidad usando la función centralizada
      const todasAgotadas = isEventoAgotado(eventosActualizados[evento._id]);
      console.log(`- Todas entradas agotadas: ${todasAgotadas}`);
      
      return eventosActualizados[evento._id];
    }
    
    // Log para depuración
    console.log(`Usando datos originales para evento ${evento._id} (${evento.nombre}):`);
    console.log('- Entradas:', evento.entradas);
    console.log('- Ventas por tipo:', evento.ventasPorTipo || 'No disponible');
    
    return evento;
  };

  const renderMensaje = () => {
    if (!user) {
      return (
        <div className="text-center py-10">
          <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-purple-800/20 flex items-center justify-center">
            <Icon icon="mdi:account-alert" className="text-purple-300 text-3xl" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Inicia sesión para ver eventos destacados</h3>
          <p className="text-gray-400">Descubre los mejores eventos seleccionados para ti</p>
        </div>
      );
    }
    
    if (!ciudad) {
      return (
        <div className="text-center py-10">
          <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-purple-800/20 flex items-center justify-center">
            <Icon icon="mdi:map-marker-alert" className="text-purple-300 text-3xl" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No hay eventos destacados para mostrar</h3>
          <p className="text-gray-400">Configura tu ubicación en tu perfil para ver eventos destacados en tu ciudad</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-6 py-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-lg text-white font-medium hover:from-purple-500 hover:to-fuchsia-500 transition-all"
          >
            Ir a mi perfil
          </button>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="text-center py-10">
          <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-red-800/20 flex items-center justify-center">
            <Icon icon="mdi:alert-circle" className="text-red-300 text-3xl" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Error al cargar eventos</h3>
          <p className="text-gray-400">No pudimos cargar los eventos destacados. Inténtalo de nuevo más tarde.</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-lg text-white font-medium hover:from-purple-500 hover:to-fuchsia-500 transition-all"
          >
            Reintentar
          </button>
        </div>
      );
    }
    
    if (eventos.length === 0 && !loading) {
      return (
        <div className="text-center py-10">
          <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-purple-800/20 flex items-center justify-center">
            <Icon icon="mdi:calendar-remove" className="text-purple-300 text-3xl" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Aún no hay eventos destacados</h3>
          <p className="text-gray-400">Pronto tendremos eventos destacados en {ciudad}</p>
        </div>
      );
    }
    
    return null;
  };

  return (
    <section className="relative w-full py-16 overflow-visible">
      {/* Fondo con textura sutil */}
      <div className="absolute inset-0 z-0 bg-black/90">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1IiBoZWlnaHQ9IjUiPgo8cmVjdCB3aWR0aD0iNSIgaGVpZ2h0PSI1IiBmaWxsPSIjMjIyIj48L3JlY3Q+CjxwYXRoIGQ9Ik0wIDVMNSAwWk02IDRMNCA2Wk0tMSAxTDEgLTFaIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMSI+PC9wYXRoPgo8L3N2Zz4=')] opacity-20"></div>
      </div>

      {/* Iconos de fuego con posiciones estáticas predefinidas */}
      <div className="absolute left-0 right-0 bottom-0 h-full overflow-hidden pointer-events-none select-none">
        {FIRE_ICONS.map((fire) => (
          <div 
            key={fire.id} 
            className="absolute" 
            style={{
              left: fire.left, 
              bottom: fire.bottom, 
              zIndex: fire.zIndex,
              transform: `rotate(${fire.rotate}deg)`,
            }}
          >
            <Icon 
              icon="mingcute:fire-line" 
              style={{
                fontSize: fire.size, 
                color: fire.color, 
                filter: `drop-shadow(0 0 16px ${fire.color})`,
                opacity: fire.opacity
              }} 
            />
          </div>
        ))}
      </div>

      {/* Contenido principal con ancho controlado */}
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="flex flex-col items-center mb-6 relative">
          {/* Título principal con resplandor neón elegante */}
          <h2 className="text-4xl md:text-6xl font-handwritten font-bold neon-fuchsia drop-shadow-lg text-center">
            Eventos Destacados
          </h2>
          {/* Línea decorativa debajo del título */}
          <div className="absolute -bottom-4 w-4/5 h-1 bg-gradient-to-r from-transparent via-fuchsia-600 to-transparent opacity-70"></div>

          {/* Subtítulo con ciudad */}
          <div className="mt-3 text-fuchsia-300/80 italic text-sm tracking-wider">
            {ciudad ? `EN ${ciudad.toUpperCase()}` : 'CONFIGURA TU CIUDAD'}
          </div>
        </div>
        
        {/* Contenedor de tarjetas con mejor espaciado */}
        <div className="flex flex-col md:flex-row gap-8 justify-center items-stretch relative px-4 mt-8">          {/* Mostrar mensaje personalizado o eventos */}
          {loading ? (
            <div className="text-center w-full py-16">
              <div className="inline-block w-12 h-12 border-4 border-fuchsia-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-fuchsia-300">Cargando eventos destacados...</p>
            </div>
          ) : (renderMensaje() || (
            Array.isArray(eventos) && eventos.length > 0 ? 
            eventos.slice(0, 3).map((evento, idx) => {
              // Usar los datos actualizados del evento si están disponibles
              const eventoActual = getEventoActualizado(evento);
              
              return evento && evento._id ? (
                <div
                  key={evento._id}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateWithLogging(navigate, `/eventos/${evento._id}`, evento._id);
                  }}
                  className="relative bg-gradient-to-b from-black/90 to-black/70 rounded-lg p-3 flex flex-col items-center shadow-2xl group hover:shadow-[0_0_25px_#ff00ea] hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                  style={{
                    transform: `rotate(${CARD_ROTATIONS[idx % CARD_ROTATIONS.length]}deg)`,
                    borderImage: 'linear-gradient(45deg, #a21caf, #ff00ea, #a21caf) 1',
                    borderWidth: '2px',
                    borderStyle: 'solid',
                    boxShadow: `0 0 20px 2px rgba(162, 28, 175, 0.4), inset 0 0 20px rgba(255, 0, 234, 0.1)`,
                    minWidth: 200,
                    maxWidth: 220,
                    flex: 1,
                    backdropFilter: 'blur(2px)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {/* Sello de "WANTED" */}
                  <div className="absolute top-2 right-2 rotate-12 opacity-80">
                    <Icon 
                      icon="game-icons:police-badge" 
                      className="text-[40px] text-fuchsia-600/60" 
                      style={{ filter: 'drop-shadow(0 0 5px rgba(255, 0, 234, 0.5))' }}
                    />
                  </div>

                  {/* Mira de francotirador con más ángulos aleatorios */}
                  {idx === 0 && (
                    <div className="absolute" style={{bottom: -30, left: -30, transform: 'rotate(15deg)'}}>
                      <Icon icon="f7:scope" className="text-[80px]" style={{color: '#00eaff', filter: 'drop-shadow(0 0 16px #00eaff)'}} />
                    </div>
                  )}
                  {idx === 2 && (
                    <div className="absolute" style={{top: -30, right: -30, transform: 'rotate(-15deg)'}}>
                      <Icon icon="f7:scope" className="text-[80px]" style={{color: '#00eaff', filter: 'drop-shadow(0 0 16px #00eaff)'}} />
                    </div>
                  )}                                   
                  <div 
                    className="w-full h-52 rounded-md overflow-hidden mb-3 border-2 relative cursor-pointer" 
                    style={{
                      borderColor: '#a21caf',
                      boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: 'rgba(0,0,0,0.3)'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateWithLogging(navigate, `/eventos/${evento._id}`, evento._id);
                    }}
                  >
                    {/* Capa de gradiente para mejorar legibilidad */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-10"></div>
                      {/* Verificar si el evento está agotado para mostrar un sello */}
                    {isEventoAgotado(eventoActual) && (
                      <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center z-30 pointer-events-none">
                        <div className="rotate-[-30deg] bg-red-500/70 text-white font-bold py-2 px-12 border-2 border-white shadow-lg text-xl" 
                             style={{backdropFilter: 'blur(2px)'}}>
                          AGOTADO
                        </div>
                      </div>
                    )}
                    
                    <img 
                      src={(() => {
                        // Función para normalizar URLs con tipo definido
                        const normalizeUrl = (url: string | null | undefined): string => {
                          if (!url || typeof url !== 'string' || url.trim() === '') {
                            return `/placeholder.jpg`;
                          }
                          
                          // Reemplazar extensiones de video por extensiones de imagen si es necesario
                          if (url.match(/\.(mp4|webm|mov)$/i)) {
                            url = url.replace(/\.(mp4|webm|mov)$/i, '.jpg');
                          }
                          
                          return url;
                        };
                          // Prioridad: cartelUrl > imagen > placeholder
                        if (eventoActual.cartelUrl) {
                          return normalizeUrl(eventoActual.cartelUrl);
                        } else if (eventoActual.imagen) {
                          return normalizeUrl(eventoActual.imagen);
                        } else if (eventoActual.imagenes && eventoActual.imagenes.length > 0) {
                          return normalizeUrl(eventoActual.imagenes[0]);
                        } else if (eventoActual.clubId?.fotoPerfil) {
                          return normalizeUrl(eventoActual.clubId.fotoPerfil);
                        }
                        
                        return `/placeholder.jpg`;
                      })()}
                      alt={eventoActual.nombre} 
                      className="object-cover w-full h-full sepia-[0.2] contrast-125 hover:scale-105 transition-transform"
                      style={{maxHeight: '100%', maxWidth: '100%'}}
                      onError={(e) => {
                        // Si hay error, usar un placeholder
                        e.currentTarget.src = `/placeholder.jpg`;
                      }}
                    />
                  </div>

                  <div className="flex flex-col items-center gap-1 w-full">
                    {/* Nombre del evento con efecto neón más pronunciado */}
                    <span 
                      className="text-lg font-bold text-center font-handwritten neon-fuchsia cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateWithLogging(navigate, `/eventos/${evento._id}`, evento._id);
                      }}
                    >
                      {eventoActual.nombre}
                    </span>
                    
                    {/* Detalles del club */}
                    <div className="flex items-center gap-1 -mt-1">
                      <Icon icon="mingcute:location-fill" className="text-fuchsia-400 text-sm" />
                      <span 
                        className="text-white/90 text-xs hover:text-fuchsia-300 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Si tenemos el ID del club, navegar a su página
                          if (eventoActual.clubId?._id) {
                            navigateWithLogging(navigate, `/clubs/${eventoActual.clubId._id}`, eventoActual.clubId._id);
                          }
                        }}
                      >
                        {eventoActual.clubId?.nombre}
                      </span>
                    </div>
                    
                    {/* Fecha con mejor formato */}
                    <div className="flex items-center gap-1 mb-1">
                      <Icon icon="mingcute:calendar-fill" className="text-fuchsia-400 text-sm" />
                      <span className="text-white/80 text-xs">
                        {new Date(eventoActual.fecha).toLocaleDateString(undefined, {
                          day: 'numeric',
                          month: 'short'
                        })}
                      </span>
                    </div>

                    {/* Géneros como tags */}
                    {eventoActual.generos && Array.isArray(eventoActual.generos) && eventoActual.generos.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-1 mt-1 mb-2">
                        {eventoActual.generos.slice(0, 3).map(genero => (
                          <span 
                            key={genero} 
                            className="text-[10px] bg-fuchsia-900/30 border border-fuchsia-700/50 text-fuchsia-300 px-2 py-0.5 rounded-full hover:bg-fuchsia-800/40 transition-colors cursor-default"
                          >
                            {genero}
                          </span>
                        ))}
                        {eventoActual.generos.length > 3 && (
                          <span className="text-[10px] bg-fuchsia-900/20 border border-fuchsia-700/30 text-fuchsia-300/70 px-2 py-0.5 rounded-full">
                            +{eventoActual.generos.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                      {/* Precio con estilo de etiqueta más refinado */}                    <div className="w-full max-w-[120px] mx-auto relative flex justify-center py-0.5 my-1">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-fuchsia-900/30 to-transparent"></div>
                      <span className="text-lg font-bold neon-fuchsia relative">                        {(() => {                          // Función para formatear el precio con estilo
                          const formatPrecio = (precio: number | string | undefined, prefix?: string): string => {
                            if (precio === undefined || precio === null) {
                              return "Desde 10.00 €";
                            }
                            
                            // Convertir a número si es necesario
                            let precioNum: number;
                            
                            if (typeof precio === 'number') {
                              precioNum = precio;
                            } else {
                              const precioLimpio = String(precio).replace(/[^\d,.]/g, '').replace(',', '.');
                              precioNum = parseFloat(precioLimpio);
                            }
                            
                            if (!isNaN(precioNum) && precioNum > 0) {
                              const precioFormateado = precioNum.toFixed(2);
                              // Siempre usamos "Desde" como prefix si no se proporciona otro prefix
                              const prefixToUse = prefix || "Desde";
                              return `${prefixToUse} ${precioFormateado} €`;
                            }
                            
                            return "Desde 10.00 €";
                          };

                          try {
                            // Verificar si el evento está agotado usando la función centralizada
                            if (isEventoAgotado(eventoActual)) {
                              return "AGOTADO";
                            }
                              
                            // Si hay entradas disponibles
                            if (eventoActual.entradas && Array.isArray(eventoActual.entradas) && eventoActual.entradas.length > 0) {
                              // Filtramos las entradas no agotadas usando la misma lógica que isEventoAgotado
                              const entradasDisponibles = eventoActual.entradas.filter(entrada => {
                                // Esta entrada está agotada si:
                                const ventasPorTipo = eventoActual.ventasPorTipo || {};
                                const vendidas = ventasPorTipo[entrada.tipo] || 0;
                                
                                // 1. Tiene aforo total y se superó
                                if (entrada.aforoTotal !== undefined) {
                                  return vendidas < entrada.aforoTotal;
                                }
                                
                                // 2. Tiene tramos y todos están agotados
                                if (entrada.tramos && Array.isArray(entrada.tramos) && entrada.tramos.length > 0) {
                                  return !entrada.tramos.every(tramo => {
                                    // Verificar según propiedades disponibles (pueden variar según backend)
                                    const tramoAny = tramo as any; // Type assertion para acceder a propiedades dinámicas
                                    
                                    if ('cantidadDisponible' in tramoAny && 'entradasVendidas' in tramoAny) {
                                      return tramoAny.entradasVendidas >= tramoAny.cantidadDisponible;
                                    }
                                    
                                    return vendidas >= (tramo.hasta || 0);
                                  });
                                }
                                
                                return true; // Si no tiene aforo ni tramos, asumir disponible
                              });
                              
                              if (entradasDisponibles.length > 0) {
                                // Prioridad para entradas de tipo General
                                const entradasGenerales = entradasDisponibles.filter(e => 
                                  e.tipo && 
                                  typeof e.tipo === 'string' && 
                                  e.tipo.toLowerCase().includes('general')
                                );
                                
                                // Función auxiliar para obtener el precio más bajo disponible de una entrada
                                const getPrecioMasBajoDisponible = (entrada: any): number | undefined => {
                                  // Si tiene tramos, buscar el tramo disponible más económico
                                  if (entrada.tramos && Array.isArray(entrada.tramos) && entrada.tramos.length > 0) {
                                    const ventasPorTipo = eventoActual.ventasPorTipo || {};
                                    const vendidas = ventasPorTipo[entrada.tipo] || 0;
                                    
                                    // Ordenar tramos por precio
                                    const tramosDisponibles = [...entrada.tramos]
                                      .filter(tramo => {
                                        // Verificar disponibilidad según propiedades presentes
                                        const tramoAny = tramo as any;
                                        
                                        if ('cantidadDisponible' in tramoAny && 'entradasVendidas' in tramoAny) {
                                          return tramoAny.entradasVendidas < tramoAny.cantidadDisponible;
                                        }
                                        
                                        return vendidas < (tramo.hasta || 0);
                                      })
                                      .sort((a, b) => {
                                        const precioA = typeof a.precio === 'number' ? a.precio : Infinity;
                                        const precioB = typeof b.precio === 'number' ? b.precio : Infinity;
                                        return precioA - precioB;
                                      });
                                      
                                    // Si hay tramos disponibles, usar el precio del más económico
                                    if (tramosDisponibles.length > 0) {
                                      return tramosDisponibles[0].precio;
                                    }
                                  }
                                  
                                  // Si no hay tramos disponibles o no tiene tramos, usar el precio base
                                  return typeof entrada.precio === 'number' ? entrada.precio : undefined;
                                };
                                
                                // Mostrar precio según prioridad:
                                  // 1. Si hay entradas generales, usar la más económica
                                if (entradasGenerales.length > 0) {
                                  const precioGeneral = getPrecioMasBajoDisponible(entradasGenerales[0]);
                                  if (precioGeneral !== undefined) {
                                    // Siempre mostrar "Desde" con el precio
                                    return formatPrecio(precioGeneral, "Desde");
                                  }
                                }
                                
                                // 2. Si no hay entradas generales disponibles, usar la entrada más económica
                                const entradasOrdenadasPorPrecio = [...entradasDisponibles].sort((a, b) => {
                                  const precioA = getPrecioMasBajoDisponible(a) || Infinity;
                                  const precioB = getPrecioMasBajoDisponible(b) || Infinity;
                                  return precioA - precioB;
                                });                                  if (entradasOrdenadasPorPrecio.length > 0) {
                                  const precioMinimo = getPrecioMasBajoDisponible(entradasOrdenadasPorPrecio[0]);
                                  if (precioMinimo !== undefined) {
                                    // Siempre mostrar "Desde" independientemente del tipo de entrada
                                    return formatPrecio(precioMinimo, "Desde");
                                  }
                                }
                              }
                            }
                            
                            // Si no pudimos determinar precios, mostrar un valor predeterminado
                            return "Desde 10.00 €";
                          } catch (e) {
                            console.error("Error al mostrar el precio:", e);
                            return "Desde 10.00 €";
                          }
                        })()}
                      </span>
                    </div>
                      {/* Botones con mejor diseño */}
                    <div className="flex gap-2 w-full justify-center mt-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          // Solo navegar a compra si no está agotado
                          if (!isEventoAgotado(eventoActual)) {
                            navigateWithLogging(navigate, `/eventos/${eventoActual._id}?action=comprar`, eventoActual._id);
                          }
                        }}
                        disabled={isEventoAgotado(eventoActual)}
                        className={`px-3 py-1.5 rounded-md font-bold border-2 ${
                          isEventoAgotado(eventoActual)
                            ? 'border-gray-500 text-gray-400 bg-black/50 cursor-not-allowed' 
                            : 'neon-fuchsia border-fuchsia-500 bg-black/80 hover:bg-fuchsia-900/50 transition shadow'
                        } text-xs`}
                        style={isEventoAgotado(eventoActual) ? {} : {boxShadow: '0 0 6px #ff00ea'}}
                      >
                        {isEventoAgotado(eventoActual) ? (
                          <span className="flex items-center justify-center">
                            <Icon icon="mdi:ticket-off" className="mr-1 text-base" />
                            Agotado
                          </span>
                        ) : (
                          <span className="flex items-center justify-center">
                            <Icon icon="mdi:ticket" className="mr-1 text-base" />
                            Comprar
                          </span>
                        )}
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateWithLogging(navigate, `/eventos/${eventoActual._id}`, eventoActual._id);
                        }}
                        className="px-3 py-1.5 rounded-md font-bold border border-fuchsia-700/50 text-fuchsia-300 bg-black/60 hover:bg-fuchsia-900/20 transition text-xs"
                      >
                        <span className="flex items-center justify-center">
                          <Icon icon="mdi:information" className="mr-1 text-base" />
                          Detalles
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : null;            })
            : null
          ))}
        </div>
      </div>
    </section>
  );
}
