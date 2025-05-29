import { X } from "lucide-react";
import { useLocation } from "react-router-dom";

const PagoCancelado = () => {
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const nombre = params.get("evento") || "el evento";

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
            <div className="flex flex-col items-center bg-white p-8 rounded shadow-md">
                <X size={64} className="text-red-500 mb-4" />
                <h1 className="text-2xl font-bold text-red-600 mb-2">Ups, tu compra no se ha realizado correctamente</h1>
                <h3 className="text-lg text-gray-700 text-center">Tu compra en <span className="font-semibold">{nombre}</span> no se ha podido realizar correctamente, vuelve a intentarlo más tarde</h3>
            </div>
        </div>
    );
};

export default PagoCancelado;