import React, { useState, useEffect, useRef } from "react";
import FiltroEventos from "../components/FiltroEventos";
import type { FiltroState } from "../components/FiltroEventos";
import { useNavigate } from "react-router-dom";
import { useUserContext } from "../context/userContext";
import MostWantedEvents from "../components/MostWantedEvents";
import IntroSection from "../components/IntroSection";
import AudienceSection from "../components/AudienceSection";
import FaqSection from "../components/FaqSection";

const videos = [
  "/videos/video1.mp4",
  "/videos/video2.mp4",
  "/videos/video3.mp4",
  "/videos/video4.mp4"
];

export default function HomePage(): React.ReactElement {
  const { user } = useUserContext();
  const navigate = useNavigate();
  const [filtros, setFiltros] = useState<FiltroState>({ lugar: "", fecha: "", generos: [], orderByRating: true, priceRanges: [] });
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleBuscar = (filtrosBusqueda: FiltroState) => {
    const params = new URLSearchParams();
    if (filtrosBusqueda.lugar && filtrosBusqueda.lugar.trim() !== "") {
      params.append("lugar", filtrosBusqueda.lugar.trim());
    }
    if (filtrosBusqueda.fecha && filtrosBusqueda.fecha.trim() !== "") {
      params.append("fecha", filtrosBusqueda.fecha.trim());
    }
    if (filtrosBusqueda.generos && filtrosBusqueda.generos.length > 0) {
      params.append("generos", filtrosBusqueda.generos.join(","));
      params.append("orderByRelevance", "true");
    }
    if (filtrosBusqueda.priceRanges && filtrosBusqueda.priceRanges.length > 0) {
      params.append("priceRanges", filtrosBusqueda.priceRanges.join(","));
    }
    const queryString = params.toString();
    navigate(`/eventos${queryString ? `?${queryString}` : ''}`);
  };

  useEffect(() => {
    if (!videoRef.current) return;
    let cancelled = false;
    const video = videoRef.current;
    video.style.transition = "opacity 0.5s ease-in-out";
    video.style.opacity = "0";
    setTimeout(() => {
      if (cancelled) return;
      video.src = videos[currentIndex];
      video.load();
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          if (!cancelled) video.style.opacity = "0.7";
        }).catch(() => {});
      }
    }, 400);
    const handleVideoEnd = () => {
      if (!cancelled) {
        video.style.opacity = "0";
        setTimeout(() => {
          if (!cancelled) setCurrentIndex(prev => (prev + 1) % videos.length);
        }, 400);
      }
    };
    const handleVideoError = () => {
      if (!cancelled) {
        video.style.opacity = "0";
        setTimeout(() => {
          if (!cancelled) setCurrentIndex(prev => (prev + 1) % videos.length);
        }, 400);
      }
    };
    video.addEventListener('ended', handleVideoEnd);
    video.addEventListener('error', handleVideoError);
    return () => {
      cancelled = true;
      video.removeEventListener('ended', handleVideoEnd);
      video.removeEventListener('error', handleVideoError);
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }, [currentIndex]);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="relative w-full min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
          <video
            ref={videoRef}
            muted
            playsInline
            className="object-cover w-full h-full opacity-0"
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '100%',
              height: '100vh',
              objectFit: 'cover',
              transition: 'opacity 0.5s ease-in-out'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-7xl font-extrabold text-center mb-8 neon-fuchsia drop-shadow-lg" style={{
            textShadow: '0 0 16px #ff00ea, 0 0 32px #ff00ea',
            fontFamily: "'Permanent Marker', cursive"
          }}>
            Welcome to Clubly
          </h1>
          <p className="text-xl md:text-3xl text-center mb-10 text-white/90 font-medium">
            El lugar donde encontrarás tu noche perfecta.
          </p>
          <div className="w-full max-w-3xl mx-auto backdrop-blur-md bg-black/30 p-6 rounded-xl shadow-xl border border-fuchsia-800/20">
            <FiltroEventos
              onFiltrar={setFiltros}
              customGenerosDropdown={true}
              onBuscar={handleBuscar}
              filtros={filtros}
            />
          </div>
        </div>
      </div>
      <div className="h-16 bg-gradient-to-b from-black via-[#0f0514] to-black"></div>
      {user ? (
        user.rol === "usuario" ? (
          <div className="w-full">
            <MostWantedEvents />
          </div>
        ) : null
      ) : (
        <IntroSection />
      )}
      <div className="h-16 bg-gradient-to-b from-black via-[#0f0514] to-black"></div>
      <AudienceSection />
      <div className="h-16 bg-gradient-to-b from-black via-[#0f0514] to-black"></div>
      <FaqSection />
    </div>
  );
}
