import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Layout
import Header from "../components/layout/Header";
import Footer from '../components/layout/Footer';

// Vistas públicas
import LoginForm from "../components/auth/LoginForm";
import RegisterForm from "../components/auth/RegisterForm";
import PetDetailPage from '../pages/PetDetailPage';

// Vista principal
import Home from "../pages/Home";

// Vistas privadas
import MyPetsPage from "../pages/MyPetsPage";
import UserProfilePage from '../pages/UserProfilePage';
import ChangePasswordPage from '../pages/ChangePasswordPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import PublicPetPage from '../pages/PublicPetPage';
import PublicAdoptionPage from '../pages/PublicAdoptionPage';
import PublicLostPage from '../pages/PublicLostPage';
import PublicFoundPage from '../pages/PublicFoundPage';
import EditPetPage from '../pages/EditPetPage';
import AdminReportsPage from '../pages/AdminReportsPage';
import ReportsByUserPage from '../pages/ReportsByUserPage';
import SuspendedUsersPage from '../pages/SuspendedUsersPage';
import AdoptionPage from '../pages/AdoptionPage';
import LostPage from '../pages/LostPage';
import FoundPage from '../pages/FoundPage';
import ChatPage from "../pages/ChatPage";
import { ChatProvider } from "../context/ChatContext";

// Vistas compartidas
// import PetList from "../components/pets/PetList";
// import FilterPanel from "../components/pets/FilterPanel";

const PrivateRoute = ({ children }) => {
  const { token, initialized } = useAuth();
  if (!initialized) {
    return (
      <div className="w-full py-16 text-center text-gray-500">Cargando...</div>
    );
  }
  if (!token) {
    return <Navigate to="/register" replace />;
  }
  return children;
};

function AppContent() {
  const location = useLocation();
  const isChatRoute = location.pathname.startsWith("/chat");

  return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/adopcion" element={<AdoptionPage />} />
            <Route path="/perdidos" element={<LostPage />} />
            <Route path="/encontrados" element={<FoundPage />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<RegisterForm />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route
              path="/mis-publicaciones"
              element={
                <PrivateRoute>
                  <MyPetsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <UserProfilePage />
                </PrivateRoute>
              }
            />
            <Route
              path="/cambiar-contraseña"
              element={
                <PrivateRoute>
                  <ChangePasswordPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/publicar"
              element={
                <PrivateRoute>
                  <PublicPetPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/publicar/adopcion"
              element={
                <PrivateRoute>
                  <PublicAdoptionPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/publicar/perdido"
              element={
                <PrivateRoute>
                  <PublicLostPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/publicar/encontrado"
              element={
                <PrivateRoute>
                  <PublicFoundPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/editar-publicacion/:id"
              element={
                <PrivateRoute>
                  <EditPetPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/reportes"
              element={
                <PrivateRoute>
                  <AdminReportsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/reportes/denunciante/:id"
              element={
                <PrivateRoute>
                  <ReportsByUserPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/reportes/denunciado/:id"
              element={
                <PrivateRoute>
                  <ReportsByUserPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/usuarios-suspendidos"
              element={
                <PrivateRoute>
                  <SuspendedUsersPage />
                </PrivateRoute>
              }
            />
            <Route path="/mascota/:id" element={<PetDetailPage />} />
            <Route
              path="/chat"
              element={
                <PrivateRoute>
                  <ChatProvider>
                    <ChatPage />
                  </ChatProvider>
                </PrivateRoute>
              }
            />
            <Route
              path="/chat/:chatId"
              element={
                <PrivateRoute>
                  <ChatProvider>
                    <ChatPage />
                  </ChatProvider>
                </PrivateRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        <Footer />
      </div>
  );

}

export default function AppRouter() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
