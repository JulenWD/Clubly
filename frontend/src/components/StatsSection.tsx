import { Users, Calendar, Music, Trophy } from 'lucide-react';

const StatsSection = () => {
  return (
    <section className="py-20 bg-black relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-20">
        <div id="stars"></div>
        <div id="stars2"></div>
        <div id="stars3"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold neon-fuchsia mb-4">Clubly en números</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-fuchsia-500 to-purple-800 mx-auto mb-6"></div>
          <p className="text-lg text-white/80 max-w-3xl mx-auto">
            Conectando a la comunidad de música electrónica de toda España
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
          <div className="text-center transform hover:scale-105 transition-all duration-300">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-fuchsia-600/20 to-purple-800/20 flex items-center justify-center border border-fuchsia-500/30">
              <Users className="text-fuchsia-400 w-10 h-10" />
            </div>
            <h3 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-purple-400 mb-2">10K+</h3>
            <p className="text-white/70 font-medium">Usuarios activos</p>
          </div>

          <div className="text-center transform hover:scale-105 transition-all duration-300">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-fuchsia-600/20 to-purple-800/20 flex items-center justify-center border border-fuchsia-500/30">
              <Calendar className="text-fuchsia-400 w-10 h-10" />
            </div>
            <h3 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-purple-400 mb-2">500+</h3>
            <p className="text-white/70 font-medium">Eventos realizados</p>
          </div>

          <div className="text-center transform hover:scale-105 transition-all duration-300">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-fuchsia-600/20 to-purple-800/20 flex items-center justify-center border border-fuchsia-500/30">
              <Music className="text-fuchsia-400 w-10 h-10" />
            </div>
            <h3 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-purple-400 mb-2">100+</h3>
            <p className="text-white/70 font-medium">DJs y artistas</p>
          </div>

          <div className="text-center transform hover:scale-105 transition-all duration-300">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-fuchsia-600/20 to-purple-800/20 flex items-center justify-center border border-fuchsia-500/30">
              <Trophy className="text-fuchsia-400 w-10 h-10" />
            </div>
            <h3 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-purple-400 mb-2">50+</h3>
            <p className="text-white/70 font-medium">Clubs colaboradores</p>
          </div>
        </div>

        <style>
          {`
          #stars {
            width: 1px;
            height: 1px;
            background: transparent;
            box-shadow: 1907px 1575px #FFF, 893px 268px #FFF, 1819px 666px #FFF, 366px 1985px #FFF;
            animation: animateStar 50s linear infinite;
          }
          
          #stars2 {
            width: 2px;
            height: 2px;
            background: transparent;
            box-shadow: 1312px 1058px #FFF, 1628px 423px #FFF, 1100px 1053px #FFF, 1440px 675px #FFF;
            animation: animateStar2 100s linear infinite;
          }
          
          #stars3 {
            width: 3px;
            height: 3px;
            background: transparent;
            box-shadow: 1697px 1356px #FFF, 909px 938px #FFF, 1412px 336px #FFF, 1344px 1787px #FFF;
            animation: animateStar3 150s linear infinite;
          }
          
          @keyframes animateStar {
            from { transform: translateY(0px); }
            to { transform: translateY(-2000px); }
          }
          
          @keyframes animateStar2 {
            from { transform: translateY(0px); }
            to { transform: translateY(-2000px); }
          }
          
          @keyframes animateStar3 {
            from { transform: translateY(0px); }
            to { transform: translateY(-2000px); }
          }
          `}
        </style>
      </div>
    </section>
  );
};

export default StatsSection;