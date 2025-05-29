import { Evento } from '../types/Evento';
import { PriceRange, calculatePriceRange } from '../types/PriceRange';

const MIN_EVENTS_FOR_VERIFICATION = 3; 

export function calculateEventAveragePrice(evento: Evento): number {
    if (!evento.entradas || evento.entradas.length === 0) {
        return 0;
    }
    
    let precioTotal = 0;
    let cantidadPrecios = 0;
    
    evento.entradas.forEach(entrada => {
        if (entrada.tramos && entrada.tramos.length > 0) {
            entrada.tramos.forEach(tramo => {
                if (tramo.precio) {
                    precioTotal += tramo.precio;
                    cantidadPrecios++;
                }
            });
        }
    });
    
    return cantidadPrecios > 0 ? precioTotal / cantidadPrecios : 0;
}


export function calculateClubPriceRange(eventos: Evento[]): { 
    priceRange: PriceRange | undefined,
    isVerified: boolean,
    averagePrice: number
} {
    const eventosConPrecios = eventos.filter(evento => {
        const precio = calculateEventAveragePrice(evento);
        return precio > 0;
    });
    
    if (eventosConPrecios.length === 0) {
        return { 
            priceRange: undefined, 
            isVerified: false,
            averagePrice: 0
        };
    }
    
    const preciosPromedio = eventosConPrecios.map(calculateEventAveragePrice);
    const precioPromedio = preciosPromedio.reduce((sum, price) => sum + price, 0) / preciosPromedio.length;
    
    return {
        priceRange: calculatePriceRange(precioPromedio),
        isVerified: eventosConPrecios.length >= MIN_EVENTS_FOR_VERIFICATION,
        averagePrice: precioPromedio
    };
}
