import React from 'react';

const UserProfile = ({ user, onEdit, onChangePassword, onDelete }) => {
  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Mi Perfil</h2>
      <div className="space-y-4">
        {Object.entries(user).map(([key, value]) => (
          key !== 'password' && key !== 'id' && (
            <div key={key}>
              <span className="text-sm font-medium text-gray-700 capitalize">{key}: </span>
              <span className="text-gray-900">{value}</span>
            </div>
          )
        ))}
      </div>
      <div className="mt-6 space-y-2">
        <button
          onClick={onEdit}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          Editar Perfil
        </button>
        <button
          onClick={onChangePassword}
          className="w-full bg-yellow-500 text-white py-2 px-4 rounded-md hover:bg-yellow-600 transition-colors"
        >
          Cambiar Contraseña
        </button>
        <button
          onClick={onDelete}
          className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
        >
          Eliminar Cuenta
        </button>
      </div>
    </div>
  );
};

export default UserProfile;