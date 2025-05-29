import { Icon } from '@iconify/react';

export default function IntroSection() {
  return (
    <>
      <section className="py-24 bg-black relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-gradient-to-br from-fuchsia-900/30 to-transparent blur-3xl"></div>
          <div className="absolute top-1/2 right-0 w-80 h-80 rounded-full bg-gradient-to-bl from-purple-900/30 to-transparent blur-3xl"></div>
          
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-fuchsia-500 to-transparent"></div>
            <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
          </div>
          
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.1)_1px,_transparent_1px)] bg-[length:20px_20px]"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-5xl mx-auto mb-14">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 neon-fuchsia font-display tracking-tight">
              Tu portal a la mejor vida nocturna
            </h2>
            <div className="w-32 h-1 bg-gradient-to-r from-fuchsia-500 to-purple-800 mx-auto mb-8"></div>
            <p className="text-xl text-white/80 mb-12 leading-relaxed max-w-3xl mx-auto">
              Clubly conecta a amantes de la música electrónica con los mejores clubs y DJs del país. 
              Descubre eventos exclusivos, compra entradas anticipadas con descuentos especiales y 
              disfruta de beneficios VIP gracias a nuestro sistema de recompensas.
            </p>
              
            <div className="flex flex-wrap justify-center gap-8 mb-8">
              <a href="/eventos" className="group relative py-4 px-8 text-lg font-medium flex items-center overflow-hidden rounded-lg transition-all duration-500 transform hover:scale-105">
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-fuchsia-600 to-purple-700"></span>
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-fuchsia-400 to-purple-500 blur-md opacity-70 
                  group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></span>
                <span className="absolute inset-0.5 bg-gradient-to-br from-fuchsia-800 to-purple-900 rounded-md"></span>
                <Icon icon="lucide:calendar" className="w-6 h-6 mr-3 relative z-10 text-white" />
                <span className="relative z-10 text-white">Explorar eventos</span>
              </a>
              
              <a href="/register" className="group relative py-4 px-8 text-lg font-medium flex items-center overflow-hidden rounded-lg transition-all duration-500 transform hover:scale-105">
                <span className="absolute inset-0 w-full h-full border-2 border-fuchsia-500/50 rounded-lg"></span>
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-fuchsia-600/20 to-purple-700/20 opacity-0 
                  group-hover:opacity-100 transition-opacity duration-500"></span>
                <span className="absolute inset-0 border-2 border-fuchsia-500/50 rounded-lg group-hover:border-fuchsia-400 
                  group-hover:shadow-[0_0_15px_rgba(217,70,239,0.5)] transition-all duration-500"></span>
                <Icon icon="lucide:user-plus" className="w-6 h-6 mr-3 relative z-10 text-fuchsia-400" />
                <span className="relative z-10 text-fuchsia-400 group-hover:text-white transition-colors duration-500">Crear cuenta</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="h-16 bg-gradient-to-b from-black via-[#0f0514] to-black"></div>

      <section className="py-16 bg-gradient-to-b from-background-slate to-black relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-fuchsia-900/20 blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-purple-900/20 blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <h3 className="text-center text-3xl md:text-4xl font-bold mb-4 neon-fuchsia font-display">
            Lo que nos hace diferentes
          </h3>
          <div className="w-24 h-1 bg-gradient-to-r from-fuchsia-500 to-purple-800 mx-auto mb-6"></div>
          <p className="text-center text-lg text-white/80 mb-14 max-w-2xl mx-auto">
            Hemos creado una plataforma pensando en todos: usuarios, DJs y propietarios de clubs
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-gradient-club border border-fuchsia-800/20 rounded-xl p-6 backdrop-blur-md shadow-xl transition-all duration-300 hover:transform hover:-translate-y-2 card-hover">
              <div className="bg-gradient-to-br from-fuchsia-500 to-purple-700 text-white p-3 rounded-lg inline-flex items-center justify-center mb-5">
                <Icon icon="lucide:ticket" className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Reservas sin complicaciones</h3>
              <p className="text-white/70">
                Compra tus entradas directamente desde la app con confirmación instantánea. Olvídate de las colas y asegura tu plaza en los eventos más exclusivos.
              </p>
            </div>
            
            <div className="bg-gradient-club border border-fuchsia-800/20 rounded-xl p-6 backdrop-blur-md shadow-xl transition-all duration-300 hover:transform hover:-translate-y-2 card-hover">
              <div className="bg-gradient-to-br from-fuchsia-500 to-purple-700 text-white p-3 rounded-lg inline-flex items-center justify-center mb-5">
                <Icon icon="lucide:star" className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Sistema de recompensas</h3>
              <p className="text-white/70">
                Gana puntos por cada visita y reseña que compartas. Canjéalos por descuentos exclusivos, accesos VIP y experiencias únicas en tus clubs favoritos.
              </p>
            </div>
            
            <div className="bg-gradient-club border border-fuchsia-800/20 rounded-xl p-6 backdrop-blur-md shadow-xl transition-all duration-300 hover:transform hover:-translate-y-2 card-hover">
              <div className="bg-gradient-to-br from-fuchsia-500 to-purple-700 text-white p-3 rounded-lg inline-flex items-center justify-center mb-5">
                <Icon icon="lucide:music" className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Descubre nuevos artistas</h3>
              <p className="text-white/70">
                Conoce a DJs emergentes y consagrados. Explora sus perfiles, escucha sus sesiones y sigue sus próximas fechas para no perderte ninguna actuación.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="h-16 bg-gradient-to-b from-black via-[#0f0514] to-black"></div>
    </>
  );
}