import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { changePassword } from '../services/UserService';
import { useNavigate } from 'react-router-dom';

const ChangePasswordPage = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    old_password: '',
    new_password_1: '',
    new_password_2: ''
  });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validatePassword = (pwd) => {
    return (
      pwd.length >= 8 &&
      /[A-Z]/.test(pwd) &&
      /[a-z]/.test(pwd) &&
      /[0-9]/.test(pwd)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!validatePassword(formData.new_password_1)) {
      setError('La nueva contraseña no cumple con los requisitos.');
      return;
    }

    if (formData.new_password_1 !== formData.new_password_2) {
      setError('Las nuevas contraseñas no coinciden.');
      return;
    }

    // 🔧 Agregar el ID del usuario al payload
    const payload = {
      id_user: user?.userId,
      ...formData,
    };

    const res = await changePassword(user?.userId, payload);

    if (res.success) {
      setSuccessMsg('Contraseña actualizada con éxito.');
      setTimeout(() => navigate('/profile'), 1500);
    } else {
      setError(res.message || 'Error al cambiar la contraseña.');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md mt-10">
      <h2 className="text-2xl font-bold mb-6 text-center">Cambiar Contraseña</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Contraseña Actual</label>
          <input
            type="password"
            name="old_password"
            value={formData.old_password}
            onChange={handleChange}
            required
            className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Nueva Contraseña</label>
          <input
            type="password"
            name="new_password_1"
            value={formData.new_password_1}
            onChange={handleChange}
            required
            className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md"
          />
          <ul className="text-sm mt-2 space-y-1">
            <li className={pwd.length >= 8 ? "text-green-600" : "text-red-600"}>
              {pwd.length >= 8 ? '✅' : '❌'} Mínimo 8 caracteres
            </li>
            <li className={/[A-Z]/.test(pwd) ? "text-green-600" : "text-red-600"}>
              {/[A-Z]/.test(pwd) ? '✅' : '❌'} Al menos una mayúscula
            </li>
            <li className={/[a-z]/.test(pwd) ? "text-green-600" : "text-red-600"}>
              {/[a-z]/.test(pwd) ? '✅' : '❌'} Al menos una minúscula
            </li>
            <li className={/\d/.test(pwd) ? "text-green-600" : "text-red-600"}>
              {/\d/.test(pwd) ? '✅' : '❌'} Al menos un número
            </li>
          </ul>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Repetir Nueva Contraseña</label>
          <input
            type="password"
            name="new_password_2"
            value={formData.new_password_2}
            onChange={handleChange}
            required
            className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {successMsg && <p className="text-green-600 text-sm">{successMsg}</p>}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
        >
          Cambiar Contraseña
        </button>
      </form>
    </div>
  );
};

export default ChangePasswordPage;
