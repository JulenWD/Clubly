import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase.config.ts";
import { useUserContext } from "../context/userContext.tsx";
import { uploadImageToCloudinary } from "../helpers/uploadImageToCloudinary";
import { Button } from "../components/Button";
import { PRICE_RANGES } from "../types/PriceRange";

const CLOUDINARY_PRESET = "Clubly";
const CLOUDINARY_CLOUDNAME = "clubly";

const RegisterPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nombre, setNombre] = useState('');
    const [gustos, setGustos] = useState('');
    const [ciudad, setCiudad] = useState('');
    const [direccion, setDireccion] = useState('');
    const [fotoUrl, setFotoUrl] = useState('');
    const [fotoFile, setFotoFile] = useState<File | null>(null);
    const [rol, setRol] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { api } = useUserContext();
    const [dni, setDni] = useState('');
    const [fechaNacimiento, setFechaNacimiento] = useState('');
    const [priceRange, setPriceRange] = useState<string>('');

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!dni) {
            setError("El DNI es obligatorio para todos los usuarios excepto admin.");
            return;
        }
        if ((rol === "usuario" || rol === "dj") && !fechaNacimiento) {
            setError("La fecha de nacimiento es obligatoria para este rol.");
            return;
        }

        try {
            const userCred = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCred.user;
            const idToken = await user.getIdToken();

            let finalFotoUrl = fotoUrl;
            if (fotoFile) {
                finalFotoUrl = await uploadImageToCloudinary(fotoFile, CLOUDINARY_PRESET, CLOUDINARY_CLOUDNAME);
            } else if (fotoUrl && fotoUrl.startsWith("http")) {
                finalFotoUrl = await uploadImageToCloudinary(fotoUrl, CLOUDINARY_PRESET, CLOUDINARY_CLOUDNAME);
            }

            await updateProfile(userCred.user, {
                displayName: nombre,
                photoURL: finalFotoUrl
            });
            const userProfile = {
                email,
                nombre,
                gustos,
                ciudad,
                fotoPerfil: finalFotoUrl,
                rol,
                dni,
                ...(fechaNacimiento && { fechaNacimiento }),
                ...(rol === 'propietario' && priceRange && { priceRangeInitial: Number(priceRange) }),
                ...(rol === 'propietario' && direccion && { direccion })
            };

            try {
                const response = await api.post(`/auth/register`, { idToken, ...userProfile });
                if (!response || !response.data || !response.data.perfil) {
                    throw new Error("Respuesta de registro inválida");
                }
                const perfil = response.data.perfil;

                if (perfil.rol === "usuario") {
                    navigate("/dashboard");
                } else if (perfil.rol === "dj") {
                    navigate("/mis-eventos");
                } else if (perfil.rol === "propietario") {
                    navigate("/mi-club");
                } else if (perfil.rol === "admin") {
                    navigate("/admin");
                } else {
                    navigate("/eventos");
                }
            } catch (err: any) {
                setError(err.response?.data?.message || err.message || "Error al comunicarse con el servidor");
            }
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFotoFile(e.target.files[0]);
            setFotoUrl(URL.createObjectURL(e.target.files[0]));
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-900 via-gray-900 to-black py-12 px-4">
            <div className="max-w-2xl mx-auto bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Crear Cuenta</h1>
                    <p className="text-gray-400">Únete a la comunidad de Clubly</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Nombre
                            </label>
                            <input
                                type="text"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Tu nombre"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="tu@email.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Contraseña
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                DNI
                            </label>
                            <input
                                type="text"
                                value={dni}
                                onChange={(e) => setDni(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="12345678A"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Ciudad
                            </label>
                            <input
                                type="text"
                                value={ciudad}
                                onChange={(e) => setCiudad(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Tu ciudad"
                                required
                            />
                        </div>

                        {rol === 'propietario' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Dirección Completa
                                </label>
                                <input
                                    type="text"
                                    value={direccion}
                                    onChange={(e) => setDireccion(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Calle, número, piso, etc."
                                    required={rol === 'propietario'}
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Fecha de Nacimiento
                            </label>
                            <input
                                type="date"
                                value={fechaNacimiento}
                                onChange={(e) => setFechaNacimiento(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                required={rol === "usuario" || rol === "dj"}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Gustos Musicales
                        </label>
                        <textarea
                            value={gustos}
                            onChange={(e) => setGustos(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Describe tus gustos musicales"
                            rows={3}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Tipo de Cuenta
                        </label>
                        <select
                            value={rol}
                            onChange={(e) => setRol(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            required
                        >
                            <option value="">Selecciona un rol</option>
                            <option value="usuario">Usuario</option>
                            <option value="dj">DJ</option>
                            <option value="propietario">Propietario de Club</option>
                            <option value="admin">Administrador</option>
                        </select>
                    </div>

                    {rol === 'propietario' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Rango de precios de tu club
                            </label>
                            <div className="mb-2 text-xs text-gray-400">
                                Este valor ayuda a los usuarios a encontrar clubs que se ajusten a su presupuesto. Se actualizará automáticamente con el tiempo basado en los precios reales de tus eventos.
                            </div>
                            <select
                                value={priceRange}
                                onChange={(e) => setPriceRange(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                required={rol === 'propietario'}
                            >
                                <option value="">Selecciona un rango de precios</option>
                                {Object.values(PRICE_RANGES).map((range) => (
                                    <option key={range.range} value={range.range}>
                                        {range.symbols} - {range.label} ({range.description})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Foto de Perfil
                        </label>
                        <div className="flex items-center space-x-4">
                            {fotoUrl && (
                                <img
                                    src={fotoUrl}
                                    alt="Vista previa"
                                    className="w-20 h-20 rounded-full object-cover"
                                />
                            )}
                            <input
                                type="file"
                                onChange={handleFileChange}
                                accept="image/*"
                                className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-400">
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                        Crear Cuenta
                    </Button>

                    <p className="text-center text-gray-400">
                        ¿Ya tienes una cuenta?{" "}
                        <Link to="/login" className="text-purple-400 hover:text-purple-300">
                            Inicia Sesión
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default RegisterPage;