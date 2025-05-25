import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Layout
import Header from "../components/layout/Header";

// Vistas públicas
import LoginForm from "../components/auth/LoginForm";
import RegisterForm from "../components/auth/RegisterForm";

// Vista principal
import Home from "../pages/Home";

// Vistas privadas
import MyPets from "../components/profile/MyPets";

// Vistas compartidas
import PetList from "../components/pets/PetList";
import FilterPanel from "../components/pets/FilterPanel";
/*
const Home = () => (
  <>
    <HeroSection />
    <AboutSection />
    <section id="pets-list" className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-6 text-center">Mascotas en Adopción</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <FilterPanel onFilterChange={() => {}} />
        </div>
        <div className="md:col-span-3">
          <PetList pets={[]} onPetClick={() => {}} />
        </div>
      </div>
    </section>
  </>
);
*/
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
          <Route
            path="/mis-publicaciones"
            element={
              <PrivateRoute>
                <MyPets />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </Router>
  );
};

export default AppRouter;



/*
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// COMPONENTES DE LAYOUT
import Header from "../components/layout/Header";
import DropdownMenu from "../components/layout/DropdownMenu";

// VISTAS PÚBLICAS
import LoginForm from "../components/auth/LoginForm";
import RegisterForm from "../components/auth/RegisterForm";
import HeroSection from "../components/home/HeroSection";
import AboutSection from "../components/home/AboutSection";

// VISTAS PRIVADAS
import MyPets from "../components/profile/MyPets";

// COMPONENTES EXTRAS
import PetList from "../components/pets/PetList";
import FilterPanel from "../components/pets/FilterPanel";

const Home = () => {
  const [filteredPets, setFilteredPets] = useState([]); // Podés inicializarlo con datos simulados si querés

  return (
    <>
      <HeroSection />
      <AboutSection />
      <section id="pets-list" className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-6 text-center">Mascotas en Adopción</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <FilterPanel onFilterChange={setFilteredPets} />
          </div>
          <div className="md:col-span-3">
            <PetList pets={filteredPets} onPetClick={() => {}} />
          </div>
        </div>
      </section>
    </>
  );
};

const PrivateRoute = ({ children }) => {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" />;
};

const AppRouter = () => {
  return (
    <Router>
      <Header />
      <Routes>
        {// Home Pública }
        <Route path="/" element={<Home />} />

        {/* Rutas Públicas }
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />

        {/* Rutas Privadas }
        <Route
          path="/mis-publicaciones"
          element={
            <PrivateRoute>
              <MyPets />
            </PrivateRoute>
          }
        />

        {/* Ruta por defecto }
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
*/
