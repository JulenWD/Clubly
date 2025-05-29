import { PriceRange, PRICE_RANGES } from "../types/PriceRange";

export function getClubPriceRangeDescription(priceRange?: PriceRange, verified: boolean = false): string {
    if (!priceRange) {
        return "Rango de precios no disponible";
    }

    const priceInfo = PRICE_RANGES[priceRange];
    
    if (!priceInfo) {
        return "Rango de precios no disponible";
    }

    const verifiedText = verified ? " (verificado)" : "";
    return `${priceInfo.symbols} - ${priceInfo.label}${verifiedText}: ${priceInfo.description}`;
}

export function formatPrice(price: number): string {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(price);
}

export function getEffectivePriceRange(priceRangeCalculated?: number, priceRangeInitial?: number) {
    if (typeof priceRangeCalculated === 'number') {
        return { priceRange: priceRangeCalculated, verified: true };
    }
    
    if (typeof priceRangeInitial === 'number') {
        return { priceRange: priceRangeInitial, verified: false };
    }
    
    return { priceRange: undefined, verified: false };
}
