import { Evento } from './Evento';
import { EntradaExtendida } from './EntradaExtendida';

export interface EventoExtendido extends Evento {
    imagenes?: string[];
    ubicacion?: string;
    thumbnail?: string;
    popularidad?: number;
    puntuacion?: number;
    destacado?: boolean;
    activo?: boolean;
    createdAt?: string;
    updatedAt?: string;
    
    entradas: EntradaExtendida[];
    
    [key: string]: any;
}
