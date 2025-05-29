import { Tooltip } from 'react-tooltip';
import { PriceRange, PRICE_RANGES } from "../types/PriceRange";
import { useState } from 'react';

interface PriceRangeIndicatorProps {
    priceRange: PriceRange;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    verified?: boolean;
}

export default function PriceRangeIndicator({ 
    priceRange, 
    className = '', 
    size = 'md',
    verified = false
}: PriceRangeIndicatorProps) {
    const [tooltipId] = useState(`price-range-${Math.random().toString(36).substr(2, 9)}`);
    
    // Tamaño de fuente según prop size
    const sizeClasses = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base'
    };
    
    const priceInfo = PRICE_RANGES[priceRange];
    
    if (!priceInfo) return null;
    
    return (
        <>
            <div 
                className={`inline-flex items-center gap-1 ${sizeClasses[size]} ${className}`}
                data-tooltip-id={tooltipId}
                data-tooltip-content={`${priceInfo.label}: ${priceInfo.description}`}
            >
                <span className={`font-semibold text-yellow-400 ${verified ? 'bg-green-900/30 px-1.5 py-0.5 rounded-md' : ''}`}>
                    {priceInfo.symbols}
                </span>
                {verified && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                )}            </div>
            <Tooltip id={tooltipId} place="top" className="z-50" />
        </>
    );
}
