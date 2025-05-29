import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import EventosPage from "./pages/EventosPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DJDashboard from "./pages/dashboards/DJDashboard";
import ClubDashboard from "./pages/dashboards/ClubDashboard";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import UserDashboard from "./pages/dashboards/UserDashboard";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoutes";
import Layout from "./components/Layout";
import CompraExitosa from "./pages/CompraExitosa";
import EventoDashboard from "./pages/dashboards/EventoDashboard";
import EventoDetalle from "./pages/EventoDetalle";
import PagoCancelado from "./pages/PagoCancelado";
import ClubsPage from "./pages/ClubsPage";
import DjsPage from "./pages/DjsPage";
import ClubPerfilPage from "./pages/perfiles/ClubPerfilPage";
import DjPerfilPage from "./pages/perfiles/DjPerfilPage";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export default function App() {
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(getAuth(), async () => {
            // Eliminamos los logs que mostraban información sensible
        });
        return () => unsubscribe();
    }, []);

    return (
        <>
            <Routes>
                <Route path="/" element={<Layout><LoginPage /></Layout>} />
                <Route path="/register" element={<Layout><RegisterPage /></Layout>} />
                <Route path="/login" element={<Layout><LoginPage /></Layout>} />
                <Route path="/home" element={<Layout><HomePage /></Layout>} />
                <Route path="/eventos" element={<Layout><EventosPage /></Layout>} />
                <Route path="/eventos/:id" element={<Layout><EventoDetalle /></Layout>} />
                <Route path="/discotecas"/>
                <Route path="/djs" element={<Layout><DjsPage /></Layout>} />
                <Route path="/about-us"/>
                <Route path="/compra-exitosa" element={<Layout><CompraExitosa /></Layout>} />
                <Route path="/pago-cancelado" element={<Layout><PagoCancelado /></Layout>} />
                <Route path="/dashboards/evento/:id" element={<Layout><EventoDashboard /></Layout>} />
                <Route path="/clubs" element={<Layout><ClubsPage /></Layout>} />
                <Route path="/clubs/:id" element={<Layout><ClubPerfilPage /></Layout>} />
                <Route path="/djs/:id" element={<Layout><DjPerfilPage /></Layout>} />
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute requiredRole="usuario">
                            <Layout><UserDashboard /></Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute requiredRole="admin">
                            <Layout><AdminDashboard /></Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/mi-club"
                    element={
                        <ProtectedRoute requiredRole="propietario">
                            <Layout><ClubDashboard /></Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/mis-eventos"
                    element={
                        <ProtectedRoute requiredRole="dj">
                            <Layout><DJDashboard /></Layout>
                        </ProtectedRoute>
                    }
                />
                <Route path="*" element={<Layout><NotFound /></Layout>} />
            </Routes>
        </>
    );
}
