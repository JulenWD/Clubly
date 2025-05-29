import { ReactNode } from 'react';
import Navbar from './Navbar';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      {/* Footer común para todas las páginas */}
      <footer className="mt-20 py-8 bg-black border-t border-purple-900 text-center text-white/70 text-sm">
        <div>Clubly &copy; {new Date().getFullYear()} &middot; Todos los derechos reservados</div>
        <div className="mt-2 flex justify-center gap-6">
          <a href="/" className="hover:text-fuchsia-400 transition">Inicio</a>
          <a href="/eventos" className="hover:text-fuchsia-400 transition">Eventos</a>
          <a href="/djs" className="hover:text-fuchsia-400 transition">DJs</a>
          <a href="/clubs" className="hover:text-fuchsia-400 transition">Clubs</a>
          <a href="/login" className="hover:text-fuchsia-400 transition">Acceso</a>
        </div>
      </footer>
      {/* Estilos neon personalizados */}
      <style>{`
        .neon-fuchsia {
          color: #ff00ea;
          text-shadow: 0 0 8px #ff00ea, 0 0 16px #ff00ea, 0 0 32px #ff00ea;
        }
      `}</style>
    </div>
  );
}