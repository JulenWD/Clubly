import { PriceRange } from './PriceRange';

export interface Club {
    _id: string;
    nombre: string;
    direccion?: string;
    ubicacion?: string;
    descripcion?: string;
    fotoPerfil?: string;
    fotoPerfilUrl?: string;
    propietarioId?: string;
    valoracionMedia?: number;
    totalValoraciones?: number;
    
    media?: number;
    total?: number;
    
    estilosMusicales?: string[];
    gustosMusicales?: string[];
    
    priceRangeInitial?: PriceRange;
    
    priceRangeCalculated?: PriceRange;
    
    priceRangeVerified?: boolean;
    
    averageTicketPrice?: number;    
    eventsAnalyzed?: number;
    
    verificado?: boolean;
}
