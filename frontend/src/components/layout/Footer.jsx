import { FaFacebookF, FaInstagram, FaTwitter } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import logo from '../../assets/logo.png'; // Asegurate de tener un logo en esta ruta

const Footer = () => {
  return (
    <footer className="bg-neutral-900 text-white py-10 mt-10 relative">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Logo y eslogan */}
        <div className="space-y-3">
          <img src={logo} alt="RescaTeam Logo" className="h-24" />
          <p className="text-sm font-light">
            Salvando vidas, una patita a la vez. 💙🐾
          </p>
        </div>

        {/* Enlaces rápidos */}
        <div>
          <h4 className="font-bold text-lg mb-3">Enlaces rápidos</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="hover:underline">Inicio</Link></li>
            <li><Link to="/publicar" className="hover:underline">Publicar Mascota</Link></li>
            <li><Link to="/login" className="hover:underline">Iniciar Sesión</Link></li>
            <li><Link to="/register" className="hover:underline">Registrarse</Link></li>
          </ul>
        </div>

        {/* Contacto */}
        <div>
          <h4 className="font-bold text-lg mb-3">Contacto</h4>
          <p className="text-sm">
            📍 Córdoba, Argentina <br />
            📞 +54 351 123 4567 <br />
            ✉️ rescateam2025@gmail.com
          </p>
        </div>

        {/* Redes sociales */}
        <div>
          <h4 className="font-bold text-lg mb-3">Seguinos</h4>
          <div className="flex space-x-4 text-white text-xl">
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:text-blue-400">
              <FaFacebookF />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-pink-400">
              <FaInstagram />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-cyan-400">
              <FaTwitter />
            </a>
          </div>
          <div className="mt-6">
            <p className="text-xs text-blue-200">© {new Date().getFullYear()} RescaTeam. Todos los derechos reservados.</p>
          </div>
        </div>
      </div>

      {/* Decoración de fondo */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-r from-yellow-300 via-pink-300 to-blue-300 opacity-10 pointer-events-none" />
    </footer>
  );
};

export default Footer;
