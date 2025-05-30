import { Star, MapPin, Headphones } from 'lucide-react';

export default function DjCard({ dj }: { dj: any }) {
    // Función para manejar el clic en toda la tarjeta
    const handleCardClick = (e: React.MouseEvent) => {
        // Prevenir acción si el clic fue en un enlace o botón
        if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) {
            e.stopPropagation();
        }
    };
    
    return (        <div 
            onClick={handleCardClick}
            className="bg-gradient-to-br from-[#121930] to-[#1a1336] rounded-lg shadow-lg overflow-hidden flex flex-col md:flex-row border border-fuchsia-900/20 md:h-[200px] hover:shadow-xl hover:shadow-fuchsia-600/20 hover:border-fuchsia-500/30 hover:scale-[1.01] hover:translate-y-[-2px] transition-all duration-300 ease-in-out transform cursor-pointer group p-1.5"
        >            <div className="h-[200px] md:h-full md:w-[180px] relative flex-shrink-0 bg-gradient-to-b from-[#0a0a14] to-[#090912] flex items-center justify-center p-4 rounded-l-lg">
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none rounded-l-lg"></div>
                <div className="w-[150px] h-[150px] rounded-full overflow-hidden border-4 border-fuchsia-700/30 group-hover:border-fuchsia-500/50 transition-all duration-500 shadow-lg shadow-fuchsia-900/30">
                    <img
                        src={dj.fotoPerfil || "/user-dark.svg"}
                        alt={`Foto de perfil de ${dj.nombre}`}
                        className="h-full w-full object-cover group-hover:scale-105 transition-all duration-700 ease-in-out"
                        style={{ objectPosition: 'center center', objectFit: 'cover' }}
                    />
                </div>
            </div>
            <div className="flex flex-col justify-between p-5 md:w-[calc(100%-180px-1.25rem)] text-white ml-2 rounded-r-md">
                <div className="space-y-4">                    <h2 className="text-2xl font-bold font-display tracking-tight neon-fuchsia">
                        {dj.nombre}
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                        <div className="flex items-center gap-3">
                            <div className="bg-fuchsia-900/30 rounded-full p-2 group-hover:bg-fuchsia-800/40 transition-colors duration-300">
                                <MapPin size={16} className="text-fuchsia-400 group-hover:text-fuchsia-300 transition-colors duration-300" />
                            </div>
                            <p className="text-gray-200 font-medium text-base">
                                {dj.ubicacion || 'Ubicación desconocida'}
                            </p>
                        </div>
                        
                                                <div className="flex items-center gap-3">
                            <div className="bg-fuchsia-900/30 rounded-full p-2 group-hover:bg-fuchsia-800/40 transition-colors duration-300">
                                <Star size={16} className="text-fuchsia-400 group-hover:text-fuchsia-300 transition-colors duration-300" />
                            </div>
                            <div className="flex items-center px-3 py-1 bg-fuchsia-900/20 rounded-full">
                                <span className="text-sm text-fuchsia-200 font-medium">{(dj.media || 0).toFixed(1)}</span>
                                <span className="text-xs text-fuchsia-300 ml-1.5">({dj.total || 0} reseñas)</span>
                            </div>
                        </div>

                        {(() => {
                            // Get the DJ's music genres from any available property
                            const generos = dj.estilosMusicales || dj.gustosMusicales || dj.generos || [];
                            
                            // Only render this section if we have genres to display
                            return generos && generos.length > 0 ? (
                                <div className="flex items-center gap-3 col-span-full mt-2">
                                    <div className="bg-fuchsia-900/30 rounded-full p-2 group-hover:bg-fuchsia-800/40 transition-colors duration-300">
                                        <Headphones size={16} className="text-fuchsia-400 group-hover:text-fuchsia-300 transition-colors duration-300" />
                                    </div>
                                    <div className="flex flex-wrap gap-2 items-center">
                                        {generos.map((genero: string, index: number) => (
                                            <span 
                                                key={index} 
                                                className="text-sm bg-fuchsia-900/40 text-fuchsia-300 px-3 py-1 rounded-full border border-fuchsia-700/30 hover:bg-fuchsia-700/50 hover:border-fuchsia-500/50 hover:text-white hover:shadow-sm hover:shadow-fuchsia-500/20 transition-all duration-300 cursor-default"
                                            >
                                                {genero}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ) : null;
                        })()}
                    </div>
                    
                                        {dj.descripcion && (
                        <p className="text-gray-300 text-sm mt-3 line-clamp-2">{dj.descripcion}</p>
                    )}
                </div>
            </div>
        </div>
    );
}
