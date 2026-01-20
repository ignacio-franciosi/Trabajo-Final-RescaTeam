import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiMail } from 'react-icons/fi';
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

  // (mobile menu removed) no-op for mobile state

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
    <>
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
                Sobre Nosotros
                <span className="pointer-events-none absolute left-3 right-3 -bottom-0.5 h-0.5 rounded-full bg-blue-500/0 group-hover:bg-blue-500 transition-all" />
              </button>
              <button
                onClick={() => handleProtectedAction('publicar')}
                disabled={!!user?.suspended}
                className={`ml-1 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${user?.suspended ? 'bg-neutral-700 text-white/50 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-500'
                  }`}
                title={user?.suspended ? 'Cuenta suspendida: no puedes publicar' : ''}
              >
                Publicar Mascota
              </button>
            </nav>

            {/* Profile / Auth */}
            <div className="hidden md:flex items-center gap-3">
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

              {/* Mensajes: burbuja a la derecha del dropdown con texto y espacio para punto */}
              <Link
                to="/chat"
                className={`relative ml-2 inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition ${isActive('/chat') ? 'bg-neutral-700 text-white' : 'bg-neutral-700/20 text-white/90 hover:bg-neutral-700/40'}`}
                aria-label="Mensajes"
              >
                <FiMail className="h-5 w-5" />
                <span className="whitespace-nowrap">Mensajes</span>
                {/* Punto dentro del contenedor, al lado derecho del texto */}
                {unreadTotal > 0 && location.pathname !== '/chat' && (
                  <span className="ml-2 inline-flex h-2.5 w-2.5 rounded-full bg-red-500 ring-1 ring-white/30 animate-pulse" aria-hidden="true" />
                )}
              </Link>
            </div>

            {/* Mobile: fila 1 - logo a la izquierda (texto oculto) y Perfil + Mensajes a la derecha */}
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
                  compact
                  label={
                    isLoggedIn && displayName && !['Perfil', 'Mi cuenta'].includes(displayName)
                      ? (() => {
                        const parts = String(displayName).split(/\s+/).filter(Boolean);
                        const first = parts[0] ?? '';
                        const rest = parts.slice(1).join(' ');
                        return (
                          <span className="flex flex-col items-start max-w-[8rem]">
                            <span className="text-sm truncate">{first}</span>
                            {rest ? <span className="text-sm truncate -mt-0.5">{rest}</span> : null}
                          </span>
                        );
                      })()
                      : 'Perfil'
                  }
                />
              )}

              <Link
                to="/chat"
                className="inline-flex items-center gap-2 rounded-full px-2 py-1 bg-neutral-700/20 text-white/90 hover:bg-neutral-700/40"
                aria-label="Mensajes"
              >
                <FiMail className="h-5 w-5" />
                <span className="text-sm whitespace-nowrap">Mensajes</span>
                {unreadTotal > 0 && location.pathname !== '/chat' && (
                  <span className="ml-1 inline-flex h-2.5 w-2.5 rounded-full bg-red-500 ring-1 ring-white/30 animate-pulse" aria-hidden="true" />
                )}
              </Link>
            </div>
          </div>
        </div>
        {/* Mobile: fila 2 - mostrar opciones del menú en horizontal (sin hamburguesa) */}
        <div className="md:hidden border-t border-white/10 bg-neutral-800/95">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center justify-between space-x-2 overflow-x-auto">
              <Link
                to="/"
                className="inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-1 text-sm text-white/90 hover:bg-neutral-700 hover:text-white"
              >
                Home
              </Link>

              {/* Mensajes ya aparece en la fila 1; no repetir aquí */}

              <button
                onClick={goToPets}
                className="inline-flex shrink-0 items-center justify-center rounded-md px-3 py-1 text-sm text-white/90 hover:bg-neutral-700 hover:text-white"
              >
                <span className="flex flex-col items-center leading-none">
                  <span className="text-sm">Ver</span>
                  <span className="text-sm -mt-0.5">mascotas</span>
                </span>
              </button>

              <button
                onClick={() => {
                  const aboutSection = document.getElementById('about');
                  if (aboutSection) {
                    aboutSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="inline-flex shrink-0 items-center justify-center rounded-md px-3 py-1 text-sm text-white/90 hover:bg-neutral-700 hover:text-white"
              >
                <span className="flex flex-col items-center leading-none">
                  <span className="text-sm">Sobre</span>
                  <span className="text-sm -mt-0.5">Nosotros</span>
                </span>
              </button>

              <button
                onClick={() => handleProtectedAction('publicar')}
                disabled={!!user?.suspended}
                className={`inline-flex shrink-0 items-center justify-center rounded-md px-3 py-1 text-sm ${user?.suspended ? 'text-white/40 bg-neutral-700 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
                title={user?.suspended ? 'Cuenta suspendida: no puedes publicar' : ''}
              >
                <span className="flex flex-col items-center leading-none">
                  <span className="text-sm">Publicar</span>
                  <span className="text-sm -mt-0.5">Mascota</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Banner de cuenta suspendida */}
      {user?.suspended && (
        <div className="sticky top-20 z-30 bg-red-600 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-center gap-2 text-sm font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>
                Tu cuenta está suspendida. Puedes ver mascotas pero no interactuar con ellas ni crear publicaciones.
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
