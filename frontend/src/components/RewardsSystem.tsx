import { useState, useEffect } from 'react';
import { useUserContext } from '../context/userContext';
import jsPDF from 'jspdf';
import * as QRCodeGen from 'qrcode';

interface ProgresoRange {
  progreso: number;
  total?: number;
  reward?: string;
  rewards?: Array<{
    threshold: number;
    type: string;
  }>;
}

interface ProgresoData {
  progreso: number;
  total: number;
  detalles: any[];
  progresosPorRango?: {
    [key: string]: ProgresoRange;
  };
}

interface Props {
  progreso: ProgresoData;
}

const REWARDS_CONFIG: Record<string, Array<{threshold: number, type: string, title: string, description: string}>> = {
  '$': [
    { threshold: 10, type: 'consumicion', title: 'Consumición gratuita', description: 'Consigue una consumición gratuita en cualquier club económico ($)' },
    { threshold: 30, type: 'entrada_gratis', title: 'Entrada gratuita', description: 'Consigue una entrada gratuita para cualquier evento en club económico ($)' },
    { threshold: 50, type: 'entrada_vip', title: 'Entrada VIP', description: 'Consigue una entrada VIP para cualquier evento en club económico ($)' },
    { threshold: 100, type: 'mesa_vip', title: 'MESA VIP', description: 'Consigue una MESA VIP en cualquier club económico ($)' }
  ],
  '$$': [
    { threshold: 10, type: 'consumicion', title: 'Consumición gratuita', description: 'Consigue una consumición gratuita en cualquier club estándar ($$)' },
    { threshold: 30, type: 'entrada_gratis', title: 'Entrada gratuita', description: 'Consigue una entrada gratuita para cualquier evento en club estándar ($$)' },
    { threshold: 50, type: 'entrada_vip', title: 'Entrada VIP', description: 'Consigue una entrada VIP para cualquier evento en club estándar ($$)' },
    { threshold: 100, type: 'mesa_vip', title: 'MESA VIP', description: 'Consigue una MESA VIP en cualquier club estándar ($$)' }
  ],
  '$$$': [
    { threshold: 10, type: 'consumicion', title: 'Consumición gratuita', description: 'Consigue una consumición gratuita en cualquier club premium ($$$)' },
    { threshold: 30, type: 'entrada_gratis', title: 'Entrada gratuita', description: 'Consigue una entrada gratuita para cualquier evento en club premium ($$$)' },
    { threshold: 50, type: 'entrada_vip', title: 'Entrada VIP', description: 'Consigue una entrada VIP para cualquier evento en club premium ($$$)' },
    { threshold: 100, type: 'mesa_vip', title: 'MESA VIP', description: 'Consigue una MESA VIP en cualquier club premium ($$$)' }
  ],
  '$$$$': [
    { threshold: 10, type: 'consumicion', title: 'Consumición gratuita', description: 'Consigue una consumición gratuita en cualquier club de lujo ($$$$)' },
    { threshold: 30, type: 'entrada_gratis', title: 'Entrada gratuita', description: 'Consigue una entrada gratuita para cualquier evento en club de lujo ($$$$)' },
    { threshold: 50, type: 'entrada_vip', title: 'Entrada VIP', description: 'Consigue una entrada VIP para cualquier evento en club de lujo ($$$$)' },
    { threshold: 100, type: 'mesa_vip', title: 'MESA VIP', description: 'Consigue una MESA VIP en cualquier club de lujo ($$$$)' }
  ]
};

const REWARD_TYPES: Record<string, {title: string, description: string}> = {
  'consumicion': {
    title: 'Consumición gratuita',
    description: 'Consigue una consumición gratuita',
  },
  'entrada_gratis': {
    title: 'Entrada gratuita',
    description: 'Consigue una entrada gratuita para cualquier evento',
  },
  'entrada_vip': {
    title: 'Entrada VIP',
    description: 'Consigue una entrada VIP para cualquier evento',
  },
  'mesa_vip': {
    title: 'MESA VIP',
    description: 'Consigue una MESA VIP en cualquier club',
  },
};

const defaultProgreso: ProgresoData = {
  progreso: 0, 
  total: 0, 
  detalles: [],
  progresosPorRango: {
    '$': { 
      progreso: 0, 
      rewards: [
        { threshold: 10, type: 'consumicion' }, 
        { threshold: 30, type: 'entrada_gratis' }, 
        { threshold: 50, type: 'entrada_vip' }, 
        { threshold: 100, type: 'mesa_vip' }
      ]
    },
    '$$': { 
      progreso: 0,
      rewards: [
        { threshold: 10, type: 'consumicion' }, 
        { threshold: 30, type: 'entrada_gratis' }, 
        { threshold: 50, type: 'entrada_vip' }, 
        { threshold: 100, type: 'mesa_vip' }
      ]
    },
    '$$$': { 
      progreso: 0, 
      rewards: [
        { threshold: 10, type: 'consumicion' }, 
        { threshold: 30, type: 'entrada_gratis' }, 
        { threshold: 50, type: 'entrada_vip' }, 
        { threshold: 100, type: 'mesa_vip' }
      ]
    },
    '$$$$': { 
      progreso: 0, 
      rewards: [
        { threshold: 10, type: 'consumicion' }, 
        { threshold: 30, type: 'entrada_gratis' }, 
        { threshold: 50, type: 'entrada_vip' }, 
        { threshold: 100, type: 'mesa_vip' }
      ]
    }
  }
};

const RewardsSystem = ({ progreso }: Props)=> {
  const { user } = useUserContext();
  const [rangoActual, setRangoActual] = useState<string>('$');
  const [showRecompensa, setShowRecompensa] = useState(false);
  const [recompensaAReclama, setRecompensaAReclama] = useState<string>('$');
  const [processedProgreso, setProcessedProgreso] = useState<ProgresoData>(defaultProgreso);
  
  const userUid = user?.uid || '';
  useEffect(() => {
    const safeProgreso: ProgresoData = { 
      ...defaultProgreso,
      ...(progreso || {})
    };
    
    safeProgreso.progresosPorRango = { 
      ...defaultProgreso.progresosPorRango 
    };
    
    if (progreso && progreso.progresosPorRango) {
      const ranges = ['$', '$$', '$$$', '$$$$'];
      ranges.forEach(range => {
        if (progreso.progresosPorRango?.[range]) {
          if (safeProgreso.progresosPorRango) {
            safeProgreso.progresosPorRango[range] = {
              ...safeProgreso.progresosPorRango[range],
              ...progreso.progresosPorRango[range]
            };
          }
        }
      });
    }
    
    if (!safeProgreso.progresosPorRango) {
      safeProgreso.progresosPorRango = { ...defaultProgreso.progresosPorRango };
    }
    
    const ranges = ['$', '$$', '$$$', '$$$$'];
    ranges.forEach(range => {
      if (!safeProgreso.progresosPorRango || !safeProgreso.progresosPorRango[range]) {
        if (!safeProgreso.progresosPorRango) {
          safeProgreso.progresosPorRango = {};
        }
        
        if (defaultProgreso.progresosPorRango && defaultProgreso.progresosPorRango[range]) {
          safeProgreso.progresosPorRango[range] = { 
            ...defaultProgreso.progresosPorRango[range] 
          };
        } else {
          safeProgreso.progresosPorRango[range] = {
            progreso: 0, 
            rewards: [
              { threshold: 10, type: 'consumicion' }, 
              { threshold: 30, type: 'entrada_gratis' }, 
              { threshold: 50, type: 'entrada_vip' }, 
              { threshold: 100, type: 'mesa_vip' }
            ]
          };
        }
      } else if (!safeProgreso.progresosPorRango[range].rewards) {
        if (safeProgreso.progresosPorRango[range].total && safeProgreso.progresosPorRango[range].reward) {
          if (defaultProgreso.progresosPorRango && defaultProgreso.progresosPorRango[range] && 
              defaultProgreso.progresosPorRango[range].rewards) {
            safeProgreso.progresosPorRango[range].rewards = [...defaultProgreso.progresosPorRango[range].rewards];
          } else {
            safeProgreso.progresosPorRango[range].rewards = [
              { threshold: 10, type: 'consumicion' }, 
              { threshold: 30, type: 'entrada_gratis' }, 
              { threshold: 50, type: 'entrada_vip' }, 
              { threshold: 100, type: 'mesa_vip' }
            ];
          }
        } else {
          safeProgreso.progresosPorRango[range].rewards = [
            { threshold: 10, type: 'consumicion' }, 
            { threshold: 30, type: 'entrada_gratis' }, 
            { threshold: 50, type: 'entrada_vip' }, 
            { threshold: 100, type: 'mesa_vip' }
          ];
        }
      }
    });
    
    setProcessedProgreso(safeProgreso);
  }, [progreso]);
    const [recompensasReclamadas, setRecompensasReclamadas] = useState<Record<string, boolean>>(() => ({
    '$': localStorage.getItem(`recompensa_reclamada_${userUid}_$`) === 'true',
    '$$': localStorage.getItem(`recompensa_reclamada_${userUid}_$$`) === 'true',
    '$$$': localStorage.getItem(`recompensa_reclamada_${userUid}_$$$`) === 'true',
    '$$$$': localStorage.getItem(`recompensa_reclamada_${userUid}_$$$$`) === 'true',
  }));
  const handleReclamarRecompensa = async () => {
    if(!user || !user.uid) return;
    
    const { achievedReward } = getCurrentReward(recompensaAReclama);
    
    if (!achievedReward) {
      return;
    }
    
    const doc = new jsPDF();
    
    doc.setFillColor(81, 33, 122);
    doc.rect(0, 0, 210, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('CLUBLY REWARDS', 105, 14, { align: 'center' });
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(22);
    doc.text(`¡Has conseguido tu recompensa!`, 105, 35, { align: 'center' });
    
    doc.setDrawColor(81, 33, 122);
    doc.line(20, 40, 190, 40);
    
    doc.setFillColor(240, 240, 250);
    doc.rect(20, 45, 170, 10, 'F');
    doc.setTextColor(81, 33, 122);
    doc.setFontSize(16);
    doc.text('Tu premio:', 30, 52);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.text(achievedReward.title, 105, 70, { align: 'center' });
    doc.setFontSize(14);
    doc.text(achievedReward.description, 105, 80, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Nombre: ${user?.nombre || user?.email || "-"}`, 30, 100);
    doc.text(`DNI: ${user?.dni || "-"}`, 30, 110);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 30, 120);
    doc.text(`Válido hasta: ${new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString()}`, 30, 130);
    
    const qrDataUrl = await QRCodeGen.toDataURL(`clubly-reward-${userUid}-${recompensaAReclama}-${Date.now()}`);
    doc.addImage(qrDataUrl, 'PNG', 125, 95, 50, 50);
    
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.text('Presenta este código en el club para canjear tu recompensa', 105, 160, { align: 'center' });
    doc.text(`Rango de precios: ${recompensaAReclama}`, 105, 170, { align: 'center' });
    doc.save(`recompensa_${recompensaAReclama}_${userUid}.pdf`);
    
    const newRecompensasReclamadas = {...recompensasReclamadas};
    newRecompensasReclamadas[recompensaAReclama] = true;
    setRecompensasReclamadas(newRecompensasReclamadas);
    
    localStorage.setItem(`recompensa_reclamada_${userUid}_${recompensaAReclama}`, 'true');
    
    setShowRecompensa(false);
  };

  const getRangoNombre = (rango: string): string => {
    switch (rango) {
      case '$': return 'Clubs Económicos ($)';
      case '$$': return 'Clubs Estándar ($$)';
      case '$$$': return 'Clubs Premium ($$$)';
      case '$$$$': return 'Clubs de Lujo ($$$$)';
      default: return 'Clubs';
    }
  };
  const getCurrentReward = (rango: string) => {
    const userProgress = processedProgreso.progresosPorRango?.[rango]?.progreso || 0;
    const rangeRewards = processedProgreso.progresosPorRango?.[rango]?.rewards || [];
    
    let achievedReward: { title: string; description: string } | null = null;
    let nextReward: { threshold: number; title: string; description: string } | null = null;
    
    for (let i = rangeRewards.length - 1; i >= 0; i--) {
      if (userProgress >= rangeRewards[i].threshold) {
        const rewardType = rangeRewards[i].type;
        if (REWARDS_CONFIG[rango] && REWARDS_CONFIG[rango][i]) {
          achievedReward = REWARDS_CONFIG[rango][i];
        } else if (REWARD_TYPES[rewardType]) {
          achievedReward = REWARD_TYPES[rewardType];
        } else {
          achievedReward = {
            title: `Recompensa nivel ${rangeRewards[i].threshold}`,
            description: `Has alcanzado el nivel ${rangeRewards[i].threshold} de recompensas`
          };
        }
        break;
      }
    }
    
    for (let i = 0; i < rangeRewards.length; i++) {
      if (userProgress < rangeRewards[i].threshold) {
        const rewardType = rangeRewards[i].type;
        if (REWARDS_CONFIG[rango] && REWARDS_CONFIG[rango][i]) {
          nextReward = { 
            ...REWARDS_CONFIG[rango][i],
            threshold: rangeRewards[i].threshold 
          };
        } else if (REWARD_TYPES[rewardType]) {
          nextReward = {
            ...REWARD_TYPES[rewardType],
            threshold: rangeRewards[i].threshold
          };
        } else {
          nextReward = {
            threshold: rangeRewards[i].threshold,
            title: `Recompensa nivel ${rangeRewards[i].threshold}`,
            description: `Alcanza el nivel ${rangeRewards[i].threshold} de recompensas`
          };
        }
        break;
      }
    }
    
    return { achievedReward, nextReward };
  };
  const getRecompensaDescripcion = (rango: string): string => {
    const { achievedReward, nextReward } = getCurrentReward(rango);
    
    if (achievedReward) {
      return `¡Felicidades! Has conseguido: ${achievedReward.title}. ${nextReward ? `Próxima recompensa en ${nextReward.threshold} reseñas.` : ''}`;
    } else if (nextReward) {
      const progress = processedProgreso.progresosPorRango?.[rango]?.progreso || 0;
      const remaining = nextReward.threshold - progress;
      return `Faltan ${remaining} reseñas para conseguir: ${nextReward.title}`;
    }
    
    return 'Consigue recompensas exclusivas dejando reseñas';
  };

  return (
    <div className="mb-10">
      <h2 className="text-2xl font-bold font-display neon-fuchsia mb-6">Progreso de recompensas</h2>
      
      <div className="bg-[#121930]/70 rounded-xl border border-fuchsia-900/30 p-6 backdrop-blur-sm">
        <div className="flex justify-center items-center mb-6">
          <button 
            onClick={() => setRangoActual(prev => {
              const rangos = ['$', '$$', '$$$', '$$$$'];
              const idx = rangos.indexOf(prev);
              return rangos[(idx - 1 + rangos.length) % rangos.length];
            })}
            className="text-fuchsia-300 hover:text-fuchsia-400 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="mx-4 text-xl font-medium text-white bg-[#1a1336] px-4 py-2 rounded-lg border border-fuchsia-900/40">
            {getRangoNombre(rangoActual)}
          </div>
          
          <button 
            onClick={() => setRangoActual(prev => {
              const rangos = ['$', '$$', '$$$', '$$$$'];
              const idx = rangos.indexOf(prev);
              return rangos[(idx + 1) % rangos.length];
            })}
            className="text-fuchsia-300 hover:text-fuchsia-400 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        <div className="flex flex-col items-center mb-6">          <div className="relative w-48 h-48 mb-4">
            <div className="absolute inset-0 rounded-full border-8 border-gray-700"></div>            
            <div 
              className="absolute inset-0 rounded-full border-8 border-fuchsia-500"
              style={{
                clipPath: `polygon(0 0, 100% 0, 100% ${Math.min(100, ((processedProgreso.progresosPorRango?.[rangoActual]?.progreso || 0) / (processedProgreso.progresosPorRango?.[rangoActual]?.rewards?.[0]?.threshold || 10)) * 100)}%, 0 ${Math.min(100, ((processedProgreso.progresosPorRango?.[rangoActual]?.progreso || 0) / (processedProgreso.progresosPorRango?.[rangoActual]?.rewards?.[0]?.threshold || 10)) * 100)}%)`
              }}
            ></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">                
                <div className="text-4xl font-bold text-white mb-1">
                  {processedProgreso.progresosPorRango?.[rangoActual]?.progreso || 0}
                </div>
                <div className="text-sm text-gray-400">
                  de {getCurrentReward(rangoActual).nextReward?.threshold || 10}
                </div>
              </div>
            </div>
          </div>
          <p className="text-lg font-medium text-fuchsia-300">Reseñas en clubs {rangoActual}</p>
        </div>
        
        <div className="bg-[#0f1124] rounded-lg p-4">
          <h3 className="text-lg font-medium text-white mb-3">Recompensa por completar reseñas:</h3>
          
          <p className="text-gray-300 mb-4">
            {getRecompensaDescripcion(rangoActual) || 'Consigue recompensas exclusivas dejando reseñas'}
          </p>            <button 
            onClick={() => {
              setRecompensaAReclama(rangoActual);
              setShowRecompensa(true);
            }}
            disabled={!getCurrentReward(rangoActual).achievedReward || 
                      recompensasReclamadas[rangoActual]}
            className="bg-gradient-to-r from-fuchsia-600 to-purple-700 hover:from-fuchsia-500 hover:to-purple-600 py-2 px-4 rounded-lg text-white font-medium shadow-lg shadow-fuchsia-900/40 transition-all disabled:opacity-50 w-full"
          >            {recompensasReclamadas[rangoActual] 
              ? "Recompensa Reclamada" 
              : getCurrentReward(rangoActual).achievedReward
                ? "Reclamar Recompensa"                : getCurrentReward(rangoActual).nextReward                  ? `Faltan ${
                      (getCurrentReward(rangoActual).nextReward && 
                      getCurrentReward(rangoActual).nextReward?.threshold !== undefined &&
                      typeof getCurrentReward(rangoActual).nextReward?.threshold === 'number') 
                        ? ((getCurrentReward(rangoActual).nextReward?.threshold || 0) - (processedProgreso.progresosPorRango?.[rangoActual]?.progreso || 0)) 
                        : 10
                    } reseñas` 
                  : "Completa reseñas"
            }
          </button>
        </div>
      </div>

      {showRecompensa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-[#121930] border border-fuchsia-900/30 rounded-xl p-6 shadow-xl shadow-fuchsia-900/30 w-full max-w-md">
            <div className="text-center">
              <div className="text-fuchsia-500 mb-4">
                <svg className="w-24 h-24 mx-auto" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2 3.5-2 3.5 2 3.5-2V4a2 2 0 00-2-2H5zm2.5 3a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm6.207.293a1 1 0 00-1.414 0l-6 6a1 1 0 101.414 1.414l6-6a1 1 0 000-1.414zM12.5 10a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" clipRule="evenodd"></path>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">¡Enhorabuena!</h3>
              <p className="text-gray-300 mb-6">Has conseguido tu recompensa para clubs {rangoActual}</p>
                <p className="bg-[#0f1124] p-3 rounded-lg text-fuchsia-300 text-lg font-medium mb-6">
                {getCurrentReward(recompensaAReclama).achievedReward?.title || "Recompensa"}
              </p>
              
              <div className="flex gap-3 justify-center">
                <button 
                  onClick={() => setShowRecompensa(false)}
                  className="bg-gray-700 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleReclamarRecompensa}
                  className="bg-gradient-to-r from-fuchsia-600 to-purple-700 hover:from-fuchsia-500 hover:to-purple-600 py-2 px-4 rounded-lg text-white font-medium shadow-lg shadow-fuchsia-900/40 transition-all"
                >
                  Descargar Recompensa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { RewardsSystem };
export default RewardsSystem;
