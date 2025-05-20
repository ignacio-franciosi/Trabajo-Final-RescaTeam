import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "../pages/Home";
import Login from "../pages/Login";
import MisPublicaciones from "../pages/MisPublicaciones";
import { useAuth } from "../context/AuthContext";

const PrivateRoute = ({ children }) => {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" />;
};

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/mis-publicaciones"
          element={
            <PrivateRoute>
              <MisPublicaciones />
            </PrivateRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
