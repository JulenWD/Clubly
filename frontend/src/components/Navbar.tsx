import { Menu, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useUserContext } from "../context/userContext";
import { signOut } from "firebase/auth"; 
import { auth } from "../firebase.config"; 

const Navbar = () => {
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const navigate = useNavigate();
    const { user, setUser } = useUserContext();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Cerrar menú al hacer click fuera
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        }
        if (menuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuOpen]);

    const defaultNavItems = [
        { label: "Inicio", href: "/" },
        { label: "Explorar", href: "/eventos" },
        { label: "Discotecas", href: "/clubs" },
        { label: "DJs", href: "/djs" },
    ];

    const toggleNavbar = () => {
        setMobileDrawerOpen(!mobileDrawerOpen);
    };

    const handleLogout = async () => {
        try {
            // Cerrar sesión en Firebase
            await signOut(auth);
            // Limpiar el contexto de usuario local
            setUser(null);
            // Redireccionar a la página de login
            navigate("/login");
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
        }
    };

    const renderNavItems = () => {
        if (!user) return defaultNavItems;
        switch (user.rol) {
            case "usuario":
                return [
                    { label: "Inicio", href: "/home" },
                    { label: "Eventos", href: "/eventos" },
                    { label: "Mis entradas", href: "/dashboard" },
                    { label: "Discotecas", href: "/clubs" },
                    { label: "DJs", href: "/djs" },
                ];
            case "dj":
                return [
                    { label: "Inicio", href: "/home" },
                    { label: "Mis eventos", href: "/mis-eventos" },
                    { label: "Buscar clubs", href: "/clubs" },
                ];
            case "propietario":
                return [
                    { label: "Inicio", href: "/home" },
                    { label: "Mi club", href: "/mi-club" },
                    { label: "Crear evento", href: "/crear-evento" },
                    { label: "Buscar DJs", href: "/djs" },
                ];
            case "admin":
                return [
                    { label: "Inicio", href: "/home" },
                    { label: "Panel admin", href: "/admin" },
                ];
            default:
                return defaultNavItems;
        }
    };

    return (
        <nav className="sticky top-0 z-50 py-3 bg-black bg-opacity-95 backdrop-blur-lg border-b border-fuchsia-900">
            <div className="container px-4 mx-auto relative lg:text-sm">                <div className="flex justify-between items-center">
                    <div className="flex items-center flex-shrink-0 w-1/4">
                        <Link to="/home" className="text-xl tracking-tight neon-fuchsia font-bold hover:opacity-80 transition-opacity font-display">
                            Clubly
                        </Link>
                    </div>
                    <div className="hidden lg:flex justify-center w-1/2">
                        <ul className="flex items-center justify-center space-x-12">
                            {renderNavItems().map((item, index) => (
                                <li key={index}>
                                    <Link to={item.href} className="text-white hover:text-fuchsia-400 transition-colors">{item.label}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="hidden lg:flex justify-end space-x-4 items-center w-1/4">
                        {user ? (                            <div className="user-menu flex items-center space-x-4 relative">
                                <img
                                    src={user.fotoPerfilUrl || "/user-dark.svg"}
                                    alt="Foto de perfil"
                                    className="profile-pic w-10 h-10 rounded-full cursor-pointer border-2 border-fuchsia-600 hover:scale-105 transition-transform shadow-md"
                                    onClick={() => setMenuOpen((open) => !open)}
                                />
                                {menuOpen && (
                                    <div 
                                        ref={menuRef} 
                                        className="dropdown-menu absolute right-0 top-12 bg-[#121930] shadow-xl shadow-fuchsia-900/20 rounded-xl p-2 min-w-[220px] border border-fuchsia-900/30 animate-fade-in z-50"
                                    >
                                        <div className="px-4 py-3 border-b border-fuchsia-900/30 mb-2">
                                            <p className="text-sm text-gray-300">Conectado como</p>
                                            <p className="text-white font-medium truncate">{user.nombre || user.email}</p>
                                        </div>
                                        
                                        {user.rol === "propietario" && (
                                            <Link to="/mi-club" className="flex items-center px-4 py-2 rounded hover:bg-fuchsia-800/30 transition-colors text-gray-200 hover:text-white">
                                                <span className="mr-2">🏢</span> Mi Club
                                            </Link>
                                        )}
                                        {user.rol === "dj" && (
                                            <Link to="/mis-eventos" className="flex items-center px-4 py-2 rounded hover:bg-fuchsia-800/30 transition-colors text-gray-200 hover:text-white">
                                                <span className="mr-2">🎧</span> Mis Eventos
                                            </Link>
                                        )}
                                        {user.rol === "usuario" && (
                                            <Link to="/dashboard" className="flex items-center px-4 py-2 rounded hover:bg-fuchsia-800/30 transition-colors text-gray-200 hover:text-white">
                                                <span className="mr-2">📋</span> Dashboard
                                            </Link>
                                        )}
                                        {user.rol === "admin" && (
                                            <Link to="/admin" className="flex items-center px-4 py-2 rounded hover:bg-fuchsia-800/30 transition-colors text-gray-200 hover:text-white">
                                                <span className="mr-2">⚙️</span> Panel Admin
                                            </Link>
                                        )}
                                        
                                        <Link to={`/perfil`} className="flex items-center px-4 py-2 rounded hover:bg-fuchsia-800/30 transition-colors text-gray-200 hover:text-white">
                                            <span className="mr-2">👤</span> Perfil
                                        </Link>

                                        <button
                                            onClick={handleLogout}
                                            className="flex w-full items-center px-4 py-2 mt-2 rounded hover:bg-red-900/30 transition-colors text-red-400 hover:text-red-300"
                                        >
                                            <span className="mr-2">🚪</span> Cerrar sesión
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>                                <Link to="/login" className="py-2 px-4 border border-fuchsia-700 hover:border-fuchsia-500 text-fuchsia-300 hover:bg-fuchsia-900/30 rounded-md transition-all">
                                    Iniciar sesión
                                </Link>
                                <Link
                                    to="/register"
                                    className="bg-gradient-to-r from-fuchsia-600 to-purple-700 hover:from-fuchsia-500 hover:to-purple-600 py-2 px-4 rounded-md text-white font-medium shadow-lg shadow-fuchsia-900/40 transition-all"
                                >
                                    Crear cuenta
                                </Link>
                            </>
                        )}
                    </div>

                    <div className="lg:hidden md:flex flex-col justify-end">
                        <button onClick={toggleNavbar}>{mobileDrawerOpen ? <X /> : <Menu />}</button>
                    </div>
                </div>

                {mobileDrawerOpen && (
                    <div className="fixed right-0 z-20 bg-neutral-900 w-full p-12 flex flex-col justify-center items-center lg:hidden">
                        <ul>
                            {renderNavItems().map((item, index) => (
                                <li key={index} className="py-4">
                                    <Link to={item.href}>{item.label}</Link>
                                </li>
                            ))}
                        </ul>
                        <div className="flex space-x-6 mt-6">
                            {user ? (
                                <button
                                    onClick={handleLogout}
                                    className="py-2 px-3 rounded-md bg-red-500 text-white"
                                >
                                    Cerrar sesión
                                </button>
                            ) : (
                                <>
                                    <Link to="/login" className="py-2 px-3 border rounded-md">
                                        Iniciar sesión
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="py-2 px-3 rounded-md bg-gradient-to-r from-orange-500 to-orange-800"
                                    >
                                        Crear cuenta
                                    </Link>
                                </>
                            )}
                        </div>
                        {user && (
                            <Link to="/perfil" className="py-2 px-3 border rounded-md bg-fuchsia-700 text-white mt-4 block text-center">
                                Perfil
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;