import { PriceRange, PRICE_RANGES } from '../types/PriceRange';

interface PriceRangeSelectorProps {
    onChange: (selectedRanges: PriceRange[]) => void;
    selectedRanges: PriceRange[];
    className?: string;
}

export default function PriceRangeSelector({ 
    onChange, 
    selectedRanges, 
    className = '' 
}: PriceRangeSelectorProps) {
    
    const handleToggleRange = (range: PriceRange) => {
        if (selectedRanges.includes(range)) {
            onChange(selectedRanges.filter(r => r !== range));
        } else {
            onChange([...selectedRanges, range]);
        }
    };
    
    return (
        <div className={`flex flex-wrap gap-2 ${className}`}>
            {Object.values(PRICE_RANGES).map((priceInfo) => {
                const isSelected = selectedRanges.includes(priceInfo.range);
                
                return (
                    <button
                        key={priceInfo.range}
                        onClick={() => handleToggleRange(priceInfo.range)}
                        className={`
                            inline-flex items-center gap-1 px-3 py-1.5 rounded-full border transition-all duration-200 text-sm
                            ${isSelected 
                                ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300 font-medium'
                                : 'bg-transparent border-gray-700 text-gray-300 hover:border-yellow-600/30 hover:bg-yellow-900/20'
                            }
                        `}
                        type="button"
                    >
                        <span className="font-semibold">{priceInfo.symbols}</span>
                        <span className="ml-1">{priceInfo.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
