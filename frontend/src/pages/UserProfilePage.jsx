import React, { useEffect, useState } from 'react';
import UserProfile from '../components/profile/UserProfile';
import EditUserForm from '../components/profile/EditUserForm';
import { useAuth } from '../context/AuthContext';
import { getUserById, deleteUser, updateUser } from '../services/UserService';
import { useNavigate } from 'react-router-dom';

const UserProfilePage = () => {
  const { user, logout } = useAuth();
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      if (!user?.userId) return;
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
  if (window.confirm('¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer.')) {
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
    setEditing(true);
  };

  const handleSaveEdit = async (updatedData) => {
    const res = await updateUser(user.userId, updatedData);
    if (res.success) {
      setUserData(res.data);
      setEditing(false);
    }
    return res;
  };

  const handleChangePassword = () => {
  navigate('/cambiar-contraseña');
  };


  return (
    <div className="min-h-screen py-10 px-4 bg-white">
      {error && <p className="text-red-600">{error}</p>}
      {editing ? (
        <EditUserForm
          initialData={userData}
          onSave={handleSaveEdit}
          onCancel={() => setEditing(false)}
        />
      ) : userData ? (
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
