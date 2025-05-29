export enum PriceRange {
    LOW = 1,     
    MEDIUM = 2,  
    HIGH = 3,    
    LUXURY = 4,  
}

export interface PriceRangeInfo {
    range: PriceRange;
    label: string;
    symbols: string;
    description: string;
}

export const PRICE_RANGES: Record<PriceRange, PriceRangeInfo> = {
    [PriceRange.LOW]: {
        range: PriceRange.LOW,
        label: 'Económico',
        symbols: '€',
        description: 'Precio medio de entrada: hasta 15€'
    },
    [PriceRange.MEDIUM]: {
        range: PriceRange.MEDIUM,
        label: 'Precio medio',
        symbols: '€€',
        description: 'Precio medio de entrada: 15€-30€'
    },
    [PriceRange.HIGH]: {
        range: PriceRange.HIGH,
        label: 'Exclusivo',
        symbols: '€€€',
        description: 'Precio medio de entrada: 30€-50€'
    },
    [PriceRange.LUXURY]: {
        range: PriceRange.LUXURY,
        label: 'Lujo',
        symbols: '€€€€',
        description: 'Precio medio de entrada: más de 50€'
    },
};

export function calculatePriceRange(averagePrice: number): PriceRange {
    if (averagePrice <= 15) {
        return PriceRange.LOW;
    } else if (averagePrice <= 30) {
        return PriceRange.MEDIUM;
    } else if (averagePrice <= 50) {
        return PriceRange.HIGH;
    } else {
        return PriceRange.LUXURY;
    }
}
