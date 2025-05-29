export default function Loader() {
  return (
    <div className="flex flex-col items-center justify-center w-full py-12">
      <div className="w-12 h-12 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <span className="text-fuchsia-400 font-semibold text-lg">Cargando eventos...</span>
    </div>
  );
}
