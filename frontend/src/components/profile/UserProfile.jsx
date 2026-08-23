import React from 'react';

const UserProfile = ({ user, onEdit, onChangePassword, onDelete, disabled = false }) => {
  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Mi Perfil</h2>

      <div className="space-y-4">
        <div>
          <span className="text-sm font-medium text-gray-700">Nombre: </span>
          <span className="text-gray-900">{user.name}</span>
        </div>
        <div>
          <span className="text-sm font-medium text-gray-700">Apellido: </span>
          <span className="text-gray-900">{user.surname}</span>
        </div>
        <div>
          <span className="text-sm font-medium text-gray-700">DNI: </span>
          <span className="text-gray-900">{user.dni}</span>
        </div>
        <div>
          <span className="text-sm font-medium text-gray-700">Email: </span>
          <span className="text-gray-900">{user.email}</span>
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <button
          onClick={() => !disabled && onEdit()}
          disabled={disabled}
          className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md transition-colors ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-blue-700'}`}
          title={disabled ? 'Cuenta suspendida: no puedes editar el perfil' : ''}
        >
          Editar Perfil
        </button>
        <button
          onClick={() => !disabled && onChangePassword()}
          disabled={disabled}
          className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md transition-colors ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-yellow-600'}`}
          title={disabled ? 'Cuenta suspendida: no puedes cambiar la contraseña' : ''}
        >
          Cambiar Contraseña
        </button>
        <button
          onClick={() => !disabled && onDelete()}
          disabled={disabled}
          className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md transition-colors ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-red-700'}`}
          title={disabled ? 'Cuenta suspendida: no puedes eliminar la cuenta' : ''}
        >
          Eliminar Cuenta
        </button>
      </div>
    </div>
  );
};

export default UserProfile;