import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
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
import EditPetPage from '../pages/EditPetPage';


// Vistas compartidas
import PetList from "../components/pets/PetList";
import FilterPanel from "../components/pets/FilterPanel";

const PrivateRoute = ({ children }) => {
  const { token } = useAuth();
  return token ? children : <Navigate to="/register" />;
};

const AppRouter = () => {
  const { token, logout } = useAuth();

  return (
    <Router>
      <Header />
      <main className="min-h-screen bg-gray-50 px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
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
            path="/editar-publicacion/:id"
            element={
              <PrivateRoute>
                <EditPetPage />
              </PrivateRoute>
            }
          />
          <Route path="/mascota/:id" element={<PetDetailPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <Footer />
      </main>
    </Router>
  );
};

export default AppRouter;
