import React, { useEffect, useState } from 'react';
import UserProfile from '../components/profile/UserProfile';
import { useAuth } from '../context/AuthContext';
import { getUserById, deleteUser } from '../services/UserService';
import { useNavigate } from 'react-router-dom';

const UserProfilePage = () => {
  const { user, logout } = useAuth();
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

    useEffect(() => {
    const fetchUser = async () => {
        if (!user || !user.userId) {
        setError("No se pudo obtener la información del usuario.");
        return;
        }

        const res = await getUserById(user.userId);
        if (res.success) {
        setUserData(res.data);
        } else {
        setError(res.message);
        }
    };

    fetchUser();
    }, [user]);


  const handleDelete = async () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar tu cuenta?')) {
      const res = await deleteUser(user.userId);
      if (res.success) {
        logout();
        navigate('/');
      } else {
        alert(res.message);
      }
    }
  };

  const handleEdit = () => {
    alert('Función de edición aún no implementada.'); // Luego la implementaremos
  };

  const handleChangePassword = () => {
    alert('Función de cambio de contraseña aún no implementada.'); // Luego la implementaremos
  };

  return (
    <div className="min-h-screen py-10 px-4 bg-gray-50">
      {error && <p className="text-red-600">{error}</p>}
      {userData ? (
        <UserProfile
          user={userData}
          onEdit={handleEdit}
          onChangePassword={handleChangePassword}
          onDelete={handleDelete}
        />
      ) : (
        <p className="text-center">Cargando datos del usuario...</p>
      )}
    </div>
  );
};

export default UserProfilePage;
