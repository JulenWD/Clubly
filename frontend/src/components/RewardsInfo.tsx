import { Icon } from '@iconify/react';

export default function RewardsInfo() {
  return (
    <section className="py-16 bg-gradient-to-b from-purple-950 to-black">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Exclusivos beneficios para miembros Clubly
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Forma parte de nuestra comunidad y disfruta de ventajas exclusivas cada vez que sales de fiesta.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-black/50 backdrop-blur-sm p-6 rounded-xl border border-purple-700/30">
            <div className="bg-gradient-to-br from-purple-600 to-fuchsia-600 w-12 h-12 flex items-center justify-center rounded-lg mb-4 mx-auto">
              <Icon icon="lucide:ticket" className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-white text-center">Acceso Prioritario</h3>
            <p className="text-gray-400 text-center">
              Salta la fila y accede directamente a los eventos con tu QR de miembro.
            </p>
          </div>

          <div className="bg-black/50 backdrop-blur-sm p-6 rounded-xl border border-purple-700/30">
            <div className="bg-gradient-to-br from-purple-600 to-fuchsia-600 w-12 h-12 flex items-center justify-center rounded-lg mb-4 mx-auto">
              <Icon icon="lucide:gift" className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-white text-center">Descuentos Exclusivos</h3>
            <p className="text-gray-400 text-center">
              Consigue ofertas especiales en entradas y consumibles solo para miembros.
            </p>
          </div>

          <div className="bg-black/50 backdrop-blur-sm p-6 rounded-xl border border-purple-700/30">
            <div className="bg-gradient-to-br from-purple-600 to-fuchsia-600 w-12 h-12 flex items-center justify-center rounded-lg mb-4 mx-auto">
              <Icon icon="lucide:star" className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-white text-center">Eventos VIP</h3>
            <p className="text-gray-400 text-center">
              Invitaciones a fiestas privadas y eventos especiales con tus artistas favoritos.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}