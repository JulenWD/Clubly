import React, { useState } from "react";
import { auth } from '../firebase.config.ts'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { Link, useNavigate } from "react-router-dom";
import { useUserContext } from "../context/userContext.tsx"
import { Button } from "../components/Button";

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { setUser, api } = useUserContext();
    
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const userCred = await signInWithEmailAndPassword(auth, email, password);
            const idToken = await userCred.user.getIdToken(true);
            const response = await api.post(`/auth/login`, { idToken });
            const perfil = response.data.perfil;
            setUser({
                ...perfil,
                fotoPerfilUrl: perfil.fotoPerfil || perfil.fotoPerfilUrl || ""
            });

            const redirectUrl = sessionStorage.getItem('redirect_after_login');
            const ticketType = sessionStorage.getItem('selected_ticket_type');
            
            if (redirectUrl && redirectUrl.includes('/eventos/')) {
                sessionStorage.removeItem('redirect_after_login');
                sessionStorage.removeItem('selected_ticket_type');
                
                if (ticketType) {
                    navigate(`${redirectUrl}?ticket=${ticketType}`);
                } else {
                    navigate(redirectUrl);
                }
                return;
            }            
            if (sessionStorage.getItem('clubly_pago_en_proceso') === 'true') {
                sessionStorage.setItem('clubly_pago_completado', 'true');
                navigate('/compra-exitosa');
                return;
            }

            switch (perfil.rol) {
                case "usuario":
                    navigate("/dashboard");
                    break;
                case "dj":
                    navigate("/mis-eventos");
                    break;
                case "propietario":
                    navigate("/mi-club");
                    break;
                case "admin":
                    navigate("/admin");
                    break;
                default:
                    navigate("/eventos");
            }
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-900 via-gray-900 to-black flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Iniciar Sesión</h1>
                    <p className="text-gray-400">Bienvenido de nuevo a Clubly</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                            Correo electrónico
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="tu@email.com"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                            Contraseña
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="••••••••"
                            required
                        />
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
                        Iniciar Sesión
                    </Button>

                    <div className="text-center">
                        <p className="text-gray-400">
                            ¿No tienes una cuenta?{" "}
                            <Link to="/register" className="text-purple-400 hover:text-purple-300">
                                Registrarse
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
