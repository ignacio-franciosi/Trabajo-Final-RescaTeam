import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import DropdownMenu from './DropdownMenu';
import { useAuth } from '../../context/AuthContext';
import favicon from '../../assets/favicon.png';
import { getUserById } from '../../services/UserService';

const Header = () => {
  const navigate = useNavigate();
  const { user, logout, token } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const location = useLocation();
  const timeoutRef = useRef(null);
  const [displayName, setDisplayName] = useState('Perfil');
  const isLoggedIn = !!token;

  const profileOptions = [
    { label: 'Ver mi perfil', action: 'profile' },
    { label: 'Mis publicaciones', action: 'mis-publicaciones' },
    ...(user?.type ? [{ label: 'Ver reportes', action: 'admin/reportes' }] : []),
    { label: 'Cerrar Sesión', action: 'logout' },
  ];

  const guestOptions = [
    { label: 'Iniciar Sesión', action: 'login' },
    { label: 'Registrarme', action: 'register' },
  ];

  const handleProfileSelect = (action) => {
    if (action === 'logout') {
      setIsLoggingOut(true);
      // realizar logout inmediato y mostrar un spinner breve antes de redirigir a login
      logout();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => navigate('/login'), 300);
      return;
    }
    navigate(`/${action}`);
  };

  // Si el token desaparece (logout completado), ocultar spinner
  useEffect(() => {
    if (!token) {
      setIsLoggingOut(false);
    }
  }, [token]);

  // Al llegar a /login, asegurarse de ocultar spinner
  useEffect(() => {
    if (location.pathname === '/login') {
      setIsLoggingOut(false);
    }
  }, [location.pathname]);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Obtener y mostrar el nombre del usuario cuando hay sesión
  useEffect(() => {
    const fetchName = async () => {
      try {
        if (token && user?.userId) {
          const res = await getUserById(user.userId);
          if (res.success) {
            const u = res.data;
            const name = [u.name, u.surname].filter(Boolean).join(' ').trim();
            setDisplayName(name || 'Mi cuenta');
          } else {
            setDisplayName('Mi cuenta');
          }
        } else {
          setDisplayName('Perfil');
        }
      } catch {
        setDisplayName('Mi cuenta');
      }
    };
    fetchName();
  }, [token, user?.userId]);

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
          <img src={favicon} alt="RescaTeam Logo" className="h-12 rounded-full" />
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
          {isLoggingOut ? (
            <div className="flex items-center text-white">
              <svg className="animate-spin h-5 w-5 text-white mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
              <span>Cerrando sesión…</span>
            </div>
          ) : (
            <DropdownMenu
              options={isLoggedIn ? profileOptions : guestOptions}
              onSelect={handleProfileSelect}
              label={isLoggedIn ? displayName : 'Perfil'}
            />
          )}
        </div>

        {/* Botón para menú móvil (pendiente) */}
        <div className="md:hidden">{/* Mobile menu */}</div>
      </div>
    </header>
  );
};

export default Header;
