interface EntradaBase {
    tipo: string;    tramos: Array<{
        hasta: number;
        precio: number;
        _id: string;
        entradasVendidas?: number;
        cantidadVendida?: number;
        cantidadDisponible?: number; 
    }>;
    _id: string;
}

export interface EntradaExtendida extends EntradaBase {
    precio?: number | string; 
    aforoTotal?: number; 
    entradasVendidas?: number;
    disponibles?: number;
    agotada?: boolean; 
    [key: string]: any; 
}
