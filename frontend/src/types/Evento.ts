import { PriceRange } from './PriceRange';

export interface Evento {
    _id: string;
    nombre: string;
    fecha: string;
    hora?: string;
    descripcion?: string;
    imagen?: string;    
    clubId?: { 
        nombre: string; 
        direccion?: string;
        ubicacion?: string;
        id?: string; 
        _id?: string;
        fotoPerfil?: string;
        priceRange?: PriceRange;
        priceRangeVerified?: boolean;
        priceRangeCalculated?: PriceRange;
        priceRangeInitial?: PriceRange;
        averageTicketPrice?: number;
    };
    club?: { 
        nombre: string; 
        direccion?: string;
        ubicacion?: string; 
        id?: string; 
        _id?: string;
        fotoPerfil?: string;
        priceRange?: PriceRange;
        priceRangeVerified?: boolean;
        priceRangeCalculated?: PriceRange;
        priceRangeInitial?: PriceRange;
        averageTicketPrice?: number;
    };
    clubMedia?: number;
    clubTotal?: number; 
    djId?: string;
    dj?: { 
        nombre: string; 
        id?: string; 
        _id?: string 
    };
    cartelUrl?: string;
    generos?: string[];
    entradas: Array<{
        tipo: string;
        tramos: Array<{
            hasta: number;
            precio: number;
            _id: string;
        }>;
        _id: string;
    }>;
    ventasPorTipo: {
        [key: string]: number;
    };
    asistentes: string[];
}