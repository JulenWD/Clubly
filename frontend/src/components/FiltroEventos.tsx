import React, { useState, useRef, useEffect } from "react";
import { PriceRange } from "../types/PriceRange";
import PriceRangeSelector from "./PriceRangeSelector";

export type FiltroState = {
    lugar: string;
    fecha: string;
    generos: string[];
    orderByRating: boolean;
    priceRanges: PriceRange[];
};

interface Props {
    onFiltrar?: (filtros: FiltroState) => void;
    onBuscar?: (filtros: FiltroState) => void;
    customGenerosDropdown?: boolean;
    filtros?: FiltroState;
}

export default function FiltroEventos({ onFiltrar, onBuscar, customGenerosDropdown, filtros }: Props): React.ReactElement {
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [localFiltros, setLocalFiltros] = useState<FiltroState>({
        lugar: filtros?.lugar ?? "",
        fecha: filtros?.fecha ?? "",
        generos: filtros?.generos ?? [],
        orderByRating: filtros?.orderByRating ?? true,
        priceRanges: filtros?.priceRanges ?? []
    });

    useEffect(() => {
        setLocalFiltros({
            lugar: filtros?.lugar ?? "",
            fecha: filtros?.fecha ?? "",
            generos: filtros?.generos ?? [],
            orderByRating: filtros?.orderByRating ?? true,
            priceRanges: filtros?.priceRanges ?? []
        });
    }, [filtros]);

    const generosDisponibles = [
        "Techno", "House", "Reggaeton", "Drum and Bass", "Comercial",
        "Pop Americano", "Reggaeton Antiguo", "Afro", "Rap", "Trap", "R&B"
    ];

    const handleLugarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalFiltros(prev => ({ ...prev, lugar: e.target.value }));
    };
    const handleFechaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalFiltros(prev => ({ ...prev, fecha: e.target.value }));
    };
    const handleGeneroChange = (genero: string) => {
        setLocalFiltros(prev => ({
            ...prev,
            generos: prev.generos.includes(genero)
                ? prev.generos.filter(g => g !== genero)
                : [...prev.generos, genero]
        }));
    };
    const handlePriceRangeChange = (ranges: PriceRange[]) => {
        setLocalFiltros(prev => ({ ...prev, priceRanges: ranges }));
    };
    const handleBuscar = (e: React.FormEvent) => {
        e.preventDefault();
        if (onFiltrar) onFiltrar(localFiltros);
        if (onBuscar) onBuscar(localFiltros);
    };

    useEffect(() => {
        if (!dropdownOpen) return;
        function handleClick(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [dropdownOpen]);

    return (
        <form className="bg-black/80 shadow-md rounded-2xl p-4 flex flex-col gap-4 mb-8 border border-fuchsia-900" onSubmit={handleBuscar}>
            <div className="flex flex-col md:flex-row gap-4 md:items-end justify-between">
                <div className="flex flex-col w-full md:w-1/3">
                    <label className="text-sm font-medium text-fuchsia-400 mb-1">
                        ¿Dónde quieres pasar tu noche?
                    </label>
                    <div className="relative">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="absolute top-1/2 left-3 -translate-y-1/2 h-4 w-4 text-fuchsia-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                                clipRule="evenodd"
                            />
                        </svg>
                        <input
                            type="text"
                            value={localFiltros.lugar}
                            onChange={handleLugarChange}
                            placeholder="Ciudad, club o dirección"
                            className="border rounded-lg p-2 pl-10 w-full bg-black text-white border-fuchsia-700 focus:border-fuchsia-400 focus:outline-none focus:ring-1 focus:ring-fuchsia-500 transition-colors duration-200"
                            autoComplete="off"
                        />
                    </div>
                </div>
                <div className="flex flex-col w-full md:w-1/3">
                    <label className="text-sm font-medium text-fuchsia-400 mb-1">Fecha</label>
                    <input
                        type="date"
                        value={localFiltros.fecha}
                        onChange={handleFechaChange}
                        className="border rounded-lg p-2 bg-black text-white border-fuchsia-700 focus:border-fuchsia-400 focus:outline-none focus:ring-1 focus:ring-fuchsia-500"
                        style={{
                            colorScheme: 'dark',
                            WebkitAppearance: 'none',
                            appearance: 'none'
                        }}
                    />
                </div>
                <div className="flex flex-col w-full md:w-1/3">
                    <div className="mb-1">
                        <label className="text-sm font-medium text-fuchsia-400">Géneros musicales</label>
                    </div>
                    {customGenerosDropdown ? (
                        <div ref={dropdownRef} className="relative">
                            <button
                                type="button"
                                className="w-full border rounded-lg p-2 bg-black text-white border-fuchsia-700 focus:border-fuchsia-400 hover:border-fuchsia-500 flex items-center justify-between h-[42px]"
                                onClick={() => setDropdownOpen(prev => !prev)}
                            >
                                {localFiltros.generos.length === 0 ? (
                                    <span className="text-fuchsia-300/50">Selecciona géneros</span>
                                ) : (
                                    <span className="text-fuchsia-300 font-semibold truncate pr-2">
                                        {localFiltros.generos.length} seleccionado{localFiltros.generos.length > 1 ? 's' : ''}
                                    </span>
                                )}
                                <span className="ml-2 text-fuchsia-400">{dropdownOpen ? '▲' : '▼'}</span>
                            </button>
                            {dropdownOpen && (
                                <div
                                    className="absolute left-0 right-0 mt-1 bg-black/95 backdrop-blur-sm border border-fuchsia-700 rounded-lg shadow-lg p-2 overflow-y-auto z-50"
                                    style={{
                                        maxHeight: '180px',
                                    }}
                                >
                                    {generosDisponibles.map((genero) => {
                                        const selected = localFiltros.generos.includes(genero);
                                        return (
                                            <div
                                                key={genero}
                                                className={`flex items-center justify-between py-2 px-3 rounded cursor-pointer transition-all duration-200 select-none mb-1 ${
                                                    selected
                                                        ? "bg-gradient-to-r from-fuchsia-700/90 to-purple-700/90 text-white font-medium shadow-sm"
                                                        : "hover:bg-fuchsia-900/40 text-white"
                                                }`}
                                                onClick={() => handleGeneroChange(genero)}
                                            >
                                                <span className="text-sm">{genero}</span>
                                                {selected && (
                                                    <span className="ml-2 text-xs bg-white/20 p-1 rounded-full text-white">✓</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2 max-w-full overflow-x-auto whitespace-nowrap py-1">
                            {generosDisponibles.map((genero) => (
                                <button
                                    key={genero}
                                    onClick={() => handleGeneroChange(genero)}
                                    className={`px-3 py-1 rounded-full border text-sm transition
                                    ${localFiltros.generos.includes(genero)
                                        ? "bg-fuchsia-600 text-white border-fuchsia-600"
                                        : "bg-black text-fuchsia-300 border-fuchsia-700/50 hover:bg-fuchsia-900/30"
                                    }`}
                                >
                                    {genero}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <div className="w-full">
                <div className="mb-1">
                    <label className="text-sm font-medium text-fuchsia-400">Rango de precios</label>
                </div>
                <PriceRangeSelector
                    selectedRanges={localFiltros.priceRanges}
                    onChange={handlePriceRangeChange}
                />
            </div>
            <div className="flex justify-end mt-2">
                <button
                    type="submit"
                    className="bg-fuchsia-700 hover:bg-fuchsia-800 text-white px-6 py-2 rounded-lg font-semibold shadow-md transition-colors duration-200"
                >
                    Buscar
                </button>
            </div>
        </form>
    );
}
