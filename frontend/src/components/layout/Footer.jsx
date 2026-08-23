import { FaFacebookF, FaInstagram, FaTwitter, FaMapMarkerAlt, FaEnvelope } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';
import { useAuth } from '../../context/AuthContext';

const Footer = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const handlePublishClick = (e) => {
    if (user?.suspended) {
      e.preventDefault();
      alert('Tu cuenta está suspendida. No puedes publicar.');
      return;
    }
    if (!token) {
      e.preventDefault();
      alert('Debes registrarte para realizar esta acción.');
      navigate('/register');
    }
  };
  return (
    <footer className="bg-neutral-900 text-white w-full">
      {/* Contenedor principal sin márgenes superiores */}
      <div className="container mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Logo y eslogan */}
        <div className="flex flex-col items-center space-y-3">
          <img
            src={logo}
            alt="RescaTeam Logo"
            className="h-24 w-auto object-contain"
          />
          <p className="text-sm text-gray-300 text-center">
            Salvando vidas, una patita a la vez
          </p>
        </div>

        {/* Enlaces rápidos */}
        <div>
          <h4 className="font-bold text-lg mb-3 text-blue-500">Enlaces rápidos</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/" className="hover:underline hover:text-rose-600 transition-colors">
                Inicio
              </Link>
            </li>
            <li>
              {user?.suspended ? (
                <span
                  className="opacity-40 cursor-not-allowed"
                  title="Cuenta suspendida: no puedes publicar"
                >
                  Publicar Mascota
                </span>
              ) : (
                <Link
                  to="/publicar"
                  onClick={handlePublishClick}
                  className="hover:underline hover:text-rose-600 transition-colors"
                >
                  Publicar Mascota
                </Link>
              )}
            </li>
            <li>
              <Link to="/login" className="hover:underline hover:text-rose-600 transition-colors">
                Iniciar Sesión
              </Link>
            </li>
            <li>
              <Link to="/register" className="hover:underline hover:text-rose-600 transition-colors">
                Registrarse
              </Link>
            </li>
          </ul>
        </div>

        {/* Contacto */}
        <div>
          <h4 className="font-bold text-lg mb-3 text-blue-500">Contacto</h4>
          <div className="space-y-2 text-sm text-gray-300">
            <p className="flex items-center gap-2">
              <FaMapMarkerAlt className="text-rose-600" />
              Córdoba, Argentina
            </p>
            <p className="flex items-center gap-2">
              <FaEnvelope className="text-rose-600" />
              rescateam2025@gmail.com
            </p>
          </div>
        </div>

        {/* Redes sociales */}
        <div>
          <h4 className="font-bold text-lg mb-3 text-blue-500">Seguinos</h4>
          <div className="flex space-x-4 text-white text-xl">
            <a href="https://facebook.com" target="_blank" rel="noreferrer"
              className="hover:text-blue-400 transition-colors">
              <FaFacebookF />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer"
              className="hover:text-pink-400 transition-colors">
              <FaInstagram />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer"
              className="hover:text-cyan-400 transition-colors">
              <FaTwitter />
            </a>
          </div>
        </div>
      </div>

      {/* Copyright centrado */}
      <div className="text-center pb-6">
        <p className="text-xs text-blue-300">
          © {new Date().getFullYear()} RescaTeam. Todos los derechos reservados.
        </p>
      </div>

      {/* Línea decorativa inferior */}
      <div className="w-full h-1 bg-gradient-to-r from-rose-600 via-rose-400 to-blue-600"></div>
    </footer>
  );
};

export default Footer;