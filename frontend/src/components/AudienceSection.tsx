import React from 'react';
import { UserRound, Music, Store } from 'lucide-react';

const AudienceSection: React.FC = () => {  return (
    <section className="py-16 bg-gradient-to-b from-black via-[#0f0514] to-black">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold neon-fuchsia mb-4 font-display">¿Quién puede usar Clubly?</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-fuchsia-500 to-purple-800 mx-auto mb-6"></div>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Nuestra plataforma conecta a todos los actores de la escena nocturna
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Card para Asistentes */}
          <div className="p-8 bg-black/50 backdrop-blur-md rounded-2xl border border-fuchsia-800/20 transform transition-all hover:-translate-y-2 hover:border-fuchsia-500/50 hover:shadow-lg hover:shadow-fuchsia-500/20 group">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-800 flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
              <UserRound className="text-white w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-white text-center mb-4">Para Asistentes</h3>
            <ul className="space-y-3 text-white/75">
              <li className="flex items-start">
                <span className="text-fuchsia-400 mr-2">✓</span>
                <span>Descubre eventos según tus gustos musicales</span>
              </li>
              <li className="flex items-start">
                <span className="text-fuchsia-400 mr-2">✓</span>
                <span>Compra entradas de forma segura y sin comisiones abusivas</span>
              </li>
              <li className="flex items-start">
                <span className="text-fuchsia-400 mr-2">✓</span>
                <span>Obtén recompensas por participar en la comunidad</span>
              </li>
              <li className="flex items-start">
                <span className="text-fuchsia-400 mr-2">✓</span>
                <span>Conecta con otros amantes de la música electrónica</span>
              </li>
            </ul>
            <div className="mt-8 text-center">
              <a 
                href="/register?type=user" 
                className="inline-block px-6 py-3 rounded-lg border border-fuchsia-500 text-fuchsia-300 hover:bg-fuchsia-900/30 transition"
              >
                Crear cuenta
              </a>
            </div>
          </div>

          {/* Card para DJs */}
          <div className="p-8 bg-black/50 backdrop-blur-md rounded-2xl border border-fuchsia-800/20 transform transition-all hover:-translate-y-2 hover:border-fuchsia-500/50 hover:shadow-lg hover:shadow-fuchsia-500/20 group">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-800 flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
              <Music className="text-white w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-white text-center mb-4">Para DJs</h3>
            <ul className="space-y-3 text-white/75">
              <li className="flex items-start">
                <span className="text-fuchsia-400 mr-2">✓</span>
                <span>Crea un perfil profesional para promocionar tu música</span>
              </li>
              <li className="flex items-start">
                <span className="text-fuchsia-400 mr-2">✓</span>
                <span>Conecta con clubes y venues interesados en tu estilo</span>
              </li>
              <li className="flex items-start">
                <span className="text-fuchsia-400 mr-2">✓</span>
                <span>Gestiona tus eventos y fechas desde un solo lugar</span>
              </li>
              <li className="flex items-start">
                <span className="text-fuchsia-400 mr-2">✓</span>
                <span>Aumenta tu visibilidad y base de seguidores</span>
              </li>
            </ul>
            <div className="mt-8 text-center">
              <a 
                href="/register?type=dj" 
                className="inline-block px-6 py-3 rounded-lg border border-fuchsia-500 text-fuchsia-300 hover:bg-fuchsia-900/30 transition"
              >
                Registrarse como DJ
              </a>
            </div>
          </div>

          {/* Card para Clubs */}
          <div className="p-8 bg-black/50 backdrop-blur-md rounded-2xl border border-fuchsia-800/20 transform transition-all hover:-translate-y-2 hover:border-fuchsia-500/50 hover:shadow-lg hover:shadow-fuchsia-500/20 group">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-800 flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
              <Store className="text-white w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-white text-center mb-4">Para Clubs</h3>
            <ul className="space-y-3 text-white/75">
              <li className="flex items-start">
                <span className="text-fuchsia-400 mr-2">✓</span>
                <span>Promociona tu local y eventos a una audiencia interesada</span>
              </li>
              <li className="flex items-start">
                <span className="text-fuchsia-400 mr-2">✓</span>
                <span>Gestiona reservas y venta de entradas eficientemente</span>
              </li>
              <li className="flex items-start">
                <span className="text-fuchsia-400 mr-2">✓</span>
                <span>Descubre talentos emergentes para tus eventos</span>
              </li>
              <li className="flex items-start">
                <span className="text-fuchsia-400 mr-2">✓</span>
                <span>Analiza datos e insights sobre tus eventos</span>
              </li>
            </ul>
            <div className="mt-8 text-center">
              <a 
                href="/register?type=club" 
                className="inline-block px-6 py-3 rounded-lg border border-fuchsia-500 text-fuchsia-300 hover:bg-fuchsia-900/30 transition"
              >
                Registrar mi Club
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AudienceSection;