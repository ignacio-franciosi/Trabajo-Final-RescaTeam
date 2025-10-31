import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiMenu, FiX } from 'react-icons/fi';
import DropdownMenu from './DropdownMenu';
import { useAuth } from '../../context/AuthContext';
import favicon from '../../assets/favicon.png';
import { getUserById } from '../../services/UserService';
import { subscribePush } from '../../push/pushClient';

const Header = () => {
  const navigate = useNavigate();
  const { user, logout, token } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const location = useLocation();
  const timeoutRef = useRef(null);
  const [displayName, setDisplayName] = useState('Perfil');
  const isLoggedIn = !!token;
  const [mobileOpen, setMobileOpen] = useState(false);

  // === total de no leídos para el badge de "Mensajes" ===
  const [unreadTotal, setUnreadTotal] = useState(() => {
    const v = Number(localStorage.getItem('chat_unread_total') || '0');
    return Number.isFinite(v) ? v : 0;
  });
  useEffect(() => {
    const update = (e) => {
      const next = e?.detail?.total ?? Number(localStorage.getItem('chat_unread_total') || '0');
      setUnreadTotal(Number(next) || 0);
    };
    window.addEventListener('chat:unread', update);
    return () => window.removeEventListener('chat:unread', update);
  }, []);
  // ===

  const MensajesLabel = () => (
    <span className="flex items-center justify-between w-full">
      <span>Mensajes</span>
      {unreadTotal > 0 && (
        <span className="ml-2 inline-flex min-w-[1.25rem] h-5 px-1.5 items-center justify-center rounded-full bg-blue-600 text-white text-[11px] font-semibold">
          {unreadTotal > 99 ? '99+' : unreadTotal}
        </span>
      )}
    </span>
  );

  const profileOptions = [
    { label: 'Ver mi perfil', action: 'profile' },
    { label: <MensajesLabel />, action: 'chat' }, // ← con badge
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
      logout();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => navigate('/login'), 300);
      return;
    }
    navigate(`/${action}`);
  };

  useEffect(() => {
    if (!token) setIsLoggingOut(false);
  }, [token]);

  useEffect(() => {
    if (location.pathname === '/login') setIsLoggingOut(false);
  }, [location.pathname]);

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

  // Suscribirse a WebPush cuando hay sesión
  useEffect(() => {
    (async () => {
      try {
        if (!token) return;
        await subscribePush(token);
      } catch (e) {
      }
    })();
  }, [token]);

  const handleProtectedAction = (action) => {
    if (!isLoggedIn) {
      alert('Debes registrarte para realizar esta acción.');
      navigate('/register');
      return;
    }
    if (user?.suspended) {
      alert('Tu cuenta está suspendida. No puedes realizar esta acción.');
      return;
    }
    navigate(`/${action}`);
  };

  // Cerrar menú móvil cuando cambia de ruta
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const goToPets = () => {
    const doScroll = () => {
      const section = document.getElementById('pets-list');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    };
    if (location.pathname === '/') {
      doScroll();
    } else {
      navigate('/#pets-list');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-neutral-800/95 backdrop-blur supports-[backdrop-filter]:bg-neutral-800/80 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <img src={favicon} alt="RescaTeam" className="h-10 w-10 rounded-full ring-1 ring-white/20 group-hover:ring-blue-500/50 transition" />
              <span className="text-xl font-semibold tracking-tight text-white">RescaTeam</span>
            </Link>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`group relative px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/') ? 'text-white' : 'text-white/80 hover:text-white'}`}
            >
              Home
              <span className={`pointer-events-none absolute left-3 right-3 -bottom-0.5 h-0.5 rounded-full transition-all ${isActive('/') ? 'bg-blue-500' : 'bg-blue-500/0 group-hover:bg-blue-500'}`} />
            </Link>
            <button
              onClick={goToPets}
              className="group relative px-3 py-2 rounded-md text-sm font-medium text-white/80 hover:text-white transition-colors"
            >
              Ver mascotas
              <span className="pointer-events-none absolute left-3 right-3 -bottom-0.5 h-0.5 rounded-full bg-blue-500/0 group-hover:bg-blue-500 transition-all" />
            </button>
            <button
              onClick={() => {
                const aboutSection = document.getElementById('about');
                if (aboutSection) {
                  aboutSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="group relative px-3 py-2 rounded-md text-sm font-medium text-white/80 hover:text-white transition-colors"
            >
              About
              <span className="pointer-events-none absolute left-3 right-3 -bottom-0.5 h-0.5 rounded-full bg-blue-500/0 group-hover:bg-blue-500 transition-all" />
            </button>
            <button
              onClick={() => handleProtectedAction('publicar')}
              disabled={!!user?.suspended}
              className={`ml-1 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                user?.suspended ? 'bg-neutral-700 text-white/50 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-500'
              }`}
              title={user?.suspended ? 'Cuenta suspendida: no puedes publicar' : ''}
            >
              Publicar Mascota
            </button>
          </nav>

          {/* Profile / Auth */}
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

          {/* Mobile: Menu button */}
          <div className="md:hidden flex items-center gap-2">
            {isLoggingOut ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            ) : (
              <DropdownMenu
                options={isLoggedIn ? profileOptions : guestOptions}
                onSelect={handleProfileSelect}
                label={isLoggedIn ? displayName : 'Perfil'}
                compact
              />
            )}
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="inline-flex items-center justify-center rounded-md p-2 text-white hover:bg-neutral-700/70 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-controls="primary-navigation"
              aria-expanded={mobileOpen}
            >
              <span className="sr-only">Abrir menú</span>
              {mobileOpen ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        id="primary-navigation"
        className={`md:hidden overflow-hidden transition-[max-height,opacity] duration-300 ${mobileOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="px-4 pb-4 pt-2 space-y-2 border-t border-white/10 bg-neutral-800/95">
          <Link
            to="/"
            className={`block rounded-md px-3 py-2 text-sm ${isActive('/') ? 'bg-neutral-700 text-white' : 'text-white/90 hover:bg-neutral-700 hover:text-white'}`}
          >
            Home
          </Link>
          <button
            onClick={goToPets}
            className="block w-full text-left rounded-md px-3 py-2 text-sm text-white/90 hover:bg-neutral-700 hover:text-white"
          >
            Ver mascotas
          </button>
          <button
            onClick={() => {
              const aboutSection = document.getElementById('about');
              if (aboutSection) {
                aboutSection.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="block w-full text-left rounded-md px-3 py-2 text-sm text-white/90 hover:bg-neutral-700 hover:text-white"
          >
            About
          </button>
          <button
            onClick={() => handleProtectedAction('publicar')}
            disabled={!!user?.suspended}
            className={`block w-full text-left rounded-md px-3 py-2 text-sm ${
              user?.suspended ? 'text-white/40 bg-neutral-700 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-500'
            }`}
            title={user?.suspended ? 'Cuenta suspendida: no puedes publicar' : ''}
          >
            Publicar Mascota
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
