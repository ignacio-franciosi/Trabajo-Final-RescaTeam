import React from 'react';
import DropdownMenu from './DropdownMenu';


const Header = ({ isLoggedIn, onLogout, onChangeView }) => {
  const profileOptions = [
    { label: 'Ver mi perfil', action: 'profile' },
    { label: 'Mis publicaciones', action: 'myPets' },
    { label: 'Cerrar Sesión', action: 'logout' },
  ];

  const guestOptions = [
    { label: 'Iniciar Sesión', action: 'login' },
    { label: 'Registrarme', action: 'register' },
  ];

  const handleProfileSelect = (action) => {
    if (action === 'logout') {
      onLogout();
    } else {
      onChangeView(action);
    }
  };

  const handleProtectedAction = (action) => {
    if (isLoggedIn) {
      onChangeView(action);
    } else {
      alert('Debes registrarte para realizar esta acción.');
      onChangeView('register');
    }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          {/* Aquí iría el logo si tuviéramos uno */}
          <h1 
            onClick={() => onChangeView('home')}
            className="text-2xl font-bold text-blue-600 cursor-pointer"
          >
            RescaTeam
          </h1>
        </div>
        
        <nav className="hidden md:flex space-x-4">
          <button 
            onClick={() => onChangeView('home')}
            className="text-gray-700 hover:text-blue-600"
          >
            Home
          </button>
          <button 
            onClick={() => {
              const aboutSection = document.getElementById('about');
              if (aboutSection) {
                aboutSection.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="text-gray-700 hover:text-blue-600"
          >
            About
          </button>
          <button 
            onClick={() => handleProtectedAction('newPet')}
            className="text-gray-700 hover:text-blue-600"
          >
            Publicar Mascota
          </button>
        </nav>

        <div className="hidden md:block">
          {isLoggedIn ? (
            <DropdownMenu options={profileOptions} onSelect={handleProfileSelect} />
          ) : (
            <DropdownMenu options={guestOptions} onSelect={handleProfileSelect} />
          )}
        </div>

        {/* Mobile menu button - Implementar si es necesario */}
        <div className="md:hidden">
          {/* Aquí iría el botón para abrir el menú móvil */}
        </div>
      </div>
    </header>
  );
};

export default Header;