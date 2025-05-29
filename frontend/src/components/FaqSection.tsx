import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: React.ReactNode;
}

const faqs: FaqItem[] = [
  {
    question: "¿Qué es Clubly?",
    answer: (
      <p>Clubly es una plataforma que conecta amantes de la música electrónica con clubs, eventos y DJs. Te permite descubrir eventos, comprar entradas y seguir a tus artistas favoritos, todo en un mismo lugar.</p>
    )
  },
  {
    question: "¿Cómo compro entradas para un evento?",
    answer: (
      <p>Para comprar entradas, primero crea una cuenta o inicia sesión. Luego, navega a la página del evento que te interesa y haz clic en "Comprar entradas". Selecciona la cantidad y sigue los pasos del proceso de pago seguro.</p>
    )
  },
  {
    question: "¿Cómo funciona el sistema de recompensas?",
    answer: (
      <p>Nuestro sistema de recompensas premia tu participación. Al dejar reseñas de clubs y DJs que hayas experimentado, acumulas puntos que puedes canjear por beneficios reales como descuentos en entradas, acceso VIP y más. Esta función está disponible exclusivamente para usuarios verificados.</p>
    )
  },
  {
    question: "¿Cómo me convierto en un usuario verificado?",
    answer: (
      <p>Para verificar tu cuenta, completa tu perfil con información válida y sigue las instrucciones en la sección "Verificación" de tu perfil. El proceso incluye confirmar tu identidad para garantizar la seguridad de todos los usuarios.</p>
    )
  },
  {
    question: "Soy dueño de un club/DJ, ¿cómo puedo promover mis eventos?",
    answer: (
      <p>Si representas a un club o eres DJ, puedes registrar una cuenta profesional. Una vez verificado, podrás crear perfiles, publicar eventos y conectar con tu audiencia. Contáctanos para más información sobre las opciones de colaboración.</p>
    )
  },
  {
    question: "¿Qué hago si tengo problemas con mi entrada o pago?",
    answer: (
      <p>Si experimentas algún problema con tu compra o pago, dirígete a la sección de "Soporte" en tu perfil o contáctanos directamente a través de nuestro formulario de contacto. Nuestro equipo estará encantado de ayudarte lo antes posible.</p>
    )
  }
];

const FaqSection: React.FC = () => {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };
  return (
    <section className="py-16 bg-gradient-to-b from-black via-[#0f0514] to-black">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold neon-fuchsia mb-4 font-display">Preguntas Frecuentes</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-fuchsia-500 to-purple-800 mx-auto mb-6"></div>
          <p className="text-lg text-white/80 max-w-3xl mx-auto">
            Respuestas a las dudas más comunes sobre Clubly
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className="mb-4 border border-fuchsia-900/30 rounded-lg overflow-hidden bg-black/60 backdrop-blur-sm hover:border-fuchsia-700/50 transition-all"
            >
              <button 
                onClick={() => toggleItem(index)}
                className="w-full px-6 py-4 text-left flex justify-between items-center focus:outline-none"
              >
                <span className="font-medium text-white text-lg">{faq.question}</span>
                {openItems.includes(index) ? (
                  <ChevronUp className="h-5 w-5 text-fuchsia-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-fuchsia-400" />
                )}
              </button>
              
              {openItems.includes(index) && (
                <div className="px-6 pb-4 text-white/70">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FaqSection;