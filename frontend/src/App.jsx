/*
import React, { useState, useEffect } from 'react';
import { users as initialUsers, pets as initialPets } from './mock/users';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import UserProfile from './components/profile/UserProfile';
import PetForm from './components/pets/PetForm';
import PetList from './components/pets/PetList';
import PetDetail from './components/pets/PetDetail';
import Header from './components/layout/Header';
import FilterPanel from './components/pets/FilterPanel';
import MyPets from './components/profile/MyPets';
import HeroSection from './components/home/HeroSection';
import AboutSection from './components/home/AboutSection';
import './index.css';


const App = () => {
  const [currentView, setCurrentView] = useState('home');
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [users, setUsers] = useState(initialUsers); // Usamos estado para los usuarios
  const [pets, setPets] = useState(initialPets);
  const [filteredPets, setFilteredPets] = useState(initialPets);
  const [selectedPet, setSelectedPet] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) {
      setLoggedInUser(storedUser);
    }
  }, []);

  useEffect(() => {
    setFilteredPets(pets);
  }, [pets]);

  const handleLogin = (credentials) => {
    const user = users.find(u => u.email === credentials.email && u.password === credentials.password);
    if (user) {
      setLoggedInUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      setCurrentView('home');
    } else {
      alert('Credenciales incorrectas');
    }
  };

  const handleRegister = (userData) => {
    const newUser = { ...userData, id: users.length + 1 };
    setUsers([...users, newUser]); // Agregamos el nuevo usuario al estado
    setLoggedInUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
    setCurrentView('home');
    alert('Registro exitoso!'); // Notificación de registro exitoso
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    localStorage.removeItem('user');
    setCurrentView('home'); // Redirigir al home después de cerrar sesión
  };

  const handleAddPet = (petData) => {
    if (!loggedInUser) {
      alert('Debes registrarte para publicar una mascota.');
      setCurrentView('register');
      return;
    }
    const newPet = { ...petData, id: pets.length + 1, userId: loggedInUser.id, adopted: false };
    setPets([...pets, newPet]); // En un app real, esto sería una llamada a API
    setCurrentView('myPets');
  };

  const handleFilterChange = (filters) => {
    let tempPets = [...pets];

    if (filters.especie) {
      tempPets = tempPets.filter(pet => pet.especie === filters.especie);
    }
    if (filters.edad) {
      tempPets = tempPets.filter(pet => {
        if (filters.edad === '0-1') return pet.edad >= 0 && pet.edad <= 1;
        if (filters.edad === '1-5') return pet.edad > 1 && pet.edad <= 5;
        if (filters.edad === '5+') return pet.edad > 5;
        return true;
      });
    }
    if (filters.tamaño) {
      tempPets = tempPets.filter(pet => pet.tamaño === filters.tamaño);
    }
    if (filters.sexo) {
      tempPets = tempPets.filter(pet => pet.sexo === filters.sexo);
    }
    if (filters.castrado) {
      tempPets = tempPets.filter(pet => pet.castrado === (filters.castrado === 'true'));
    }
    if (filters.vacunas) {
      tempPets = tempPets.filter(pet => pet.vacunas === (filters.vacunas === 'true'));
    }
    if (filters.zona) {
      tempPets = tempPets.filter(pet => pet.zona.toLowerCase().includes(filters.zona.toLowerCase()));
    }

    setFilteredPets(tempPets);
  };

  const handleEditPet = (pet) => {
     if (!loggedInUser) {
      alert('Debes registrarte para editar publicaciones.');
      setCurrentView('register');
      return;
    }
    // Implementar lógica de edición (quizás navegar a un formulario pre-llenado)
    alert(`Editar mascota: ${pet.nombre}`);
  };

  const handleDeletePet = (petToDelete) => {
     if (!loggedInUser) {
      alert('Debes registrarte para eliminar publicaciones.');
      setCurrentView('register');
      return;
    }
    if (window.confirm(`¿Estás seguro de eliminar la publicación de ${petToDelete.nombre || 'esta mascota'}?`)) {
      setPets(pets.filter(pet => pet.id !== petToDelete.id)); // En un app real, esto sería una llamada a API
    }
  };

  const handleMarkAdopted = (petToMark) => {
     if (!loggedInUser) {
      alert('Debes registrarte para marcar publicaciones como adoptadas.');
      setCurrentView('register');
      return;
    }
    setPets(pets.map(pet => 
      pet.id === petToMark.id ? { ...pet, adopted: true } : pet
    )); // En un app real, esto sería una llamada a API
  };

  const handleScrollToPets = () => {
    const petsSection = document.getElementById('pets-list');
    if (petsSection) {
      petsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return (
          <>
            <HeroSection onScrollToPets={handleScrollToPets} />
            <AboutSection />
            <section id="pets-list" className="container mx-auto px-4 py-8">
              <h2 className="text-3xl font-bold mb-6 text-center">Mascotas en Adopción</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-1">
                  <FilterPanel onFilterChange={handleFilterChange} />
                </div>
                <div className="md:col-span-3">
                  <PetList 
                    pets={filteredPets.filter(pet => !pet.adopted)} // Mostrar solo no adoptados en el listado general
                    onPetClick={(pet) => {
                      setSelectedPet(pet);
                      setCurrentView('petDetail');
                    }}
                  />
                </div>
              </div>
            </section>
          </>
        );
      case 'login':
        return <LoginForm onLogin={handleLogin} />;
      case 'register':
        return (
          <div className="container mx-auto px-4 py-8">
            <RegisterForm onRegister={handleRegister} existingUsers={users} />
          </div>
        );
      case 'profile':
         if (!loggedInUser) {
            setCurrentView('register');
            return null; // No renderizar el perfil si no está logueado
          }
        return (
          <div className="container mx-auto px-4 py-8">
            <UserProfile 
              user={loggedInUser} 
              onEdit={() => alert('Funcionalidad de editar perfil')}
              onChangePassword={() => alert('Funcionalidad de cambiar contraseña')}
              onDelete={() => {
                if (window.confirm('¿Estás seguro de eliminar tu cuenta?')) {
                  handleLogout();
                }
              }}
            />
          </div>
        );
      case 'myPets':
         if (!loggedInUser) {
            setCurrentView('register');
            return null; // No renderizar mis publicaciones si no está logueado
          }
        const userPets = pets.filter(pet => loggedInUser && pet.userId === loggedInUser.id);
        return (
          <div className="container mx-auto px-4 py-8">
            <MyPets 
              pets={userPets} 
              onEdit={handleEditPet}
              onDelete={handleDeletePet}
              onMarkAdopted={handleMarkAdopted}
            />
          </div>
        );
      case 'petDetail':
        return (
          <div className="container mx-auto px-4 py-8">
            <button 
              onClick={() => setCurrentView('home')} // Volver al home con listado
              className="mb-4 text-blue-600 hover:text-blue-800"
            >
              ← Volver al listado
            </button>
            <PetDetail pet={selectedPet} />
          </div>
        );
      case 'newPet':
         if (!loggedInUser) {
            setCurrentView('register');
            return null; // No renderizar el formulario si no está logueado
          }
        return (
          <div className="container mx-auto px-4 py-8">
            <PetForm onSubmit={handleAddPet} />
          </div>
        );
      default:
        return <div>Vista no encontrada</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        isLoggedIn={!!loggedInUser} 
        onLogout={handleLogout}
        onChangeView={setCurrentView}
      />
      <main>
        {renderView()}
      </main>
    </div>
  );
};

export default App;

// DONE


import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
*/