import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DropdownMenu from './DropdownMenu';
import { useAuth } from '../../context/AuthContext';
import favicon from '../../assets/favicon.png';

const Header = () => {
  const navigate = useNavigate();
  const { user, logout, token } = useAuth();
  const isLoggedIn = !!token;

  const profileOptions = [
    { label: 'Ver mi perfil', action: 'profile' },
    { label: 'Mis publicaciones', action: 'mis-publicaciones' },
    { label: 'Cerrar Sesión', action: 'logout' },
  ];

  const guestOptions = [
    { label: 'Iniciar Sesión', action: 'login' },
    { label: 'Registrarme', action: 'register' },
  ];

  const handleProfileSelect = (action) => {
    if (action === 'logout') {
      logout();
      setTimeout(() => navigate('/'), 100);
    } else {
      navigate(`/${action}`);
    }
  };

  const handleProtectedAction = (action) => {
    if (isLoggedIn) {
      navigate(`/${action}`);
    } else {
      alert('Debes registrarte para realizar esta acción.');
      navigate('/register');
    }
  };

  return (
    <header className="bg-neutral-800 shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Link to="/" className="text-2xl font-bold text-white cursor-pointer">
            RescaTeam
          </Link>
          <img src={favicon} alt="RescaTeam Logo" className="h-12" />
        </div>

        <nav className="hidden md:flex space-x-4">
          <Link to="/" className="text-white hover:text-blue-600">
            Home
          </Link>
          <button
            onClick={() => {
              const aboutSection = document.getElementById('about');
              if (aboutSection) {
                aboutSection.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="text-white hover:text-blue-600"
          >
            About
          </button>
          <button
            onClick={() => handleProtectedAction('publicar')}
            className="text-white hover:text-blue-600"
          >
            Publicar Mascota
          </button>
        </nav>

        <div className="hidden md:block">
          <DropdownMenu
            options={isLoggedIn ? profileOptions : guestOptions}
            onSelect={handleProfileSelect}
          />
        </div>

        {/* Botón para menú móvil (pendiente) */}
        <div className="md:hidden">{/* Mobile menu */}</div>
      </div>
    </header>
  );
};

export default Header;