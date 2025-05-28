import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { resetPassword } from '../services/UserService';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    new_password_1: '',
    new_password_2: ''
  });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    if (!tokenParam) {
      setError('Token inválido o faltante');
    } else {
      setToken(tokenParam);
    }
  }, []);

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

    const { new_password_1, new_password_2 } = formData;

    if (!validatePassword(new_password_1)) {
      setError('La nueva contraseña no cumple con los requisitos de seguridad.');
      return;
    }

    if (new_password_1 !== new_password_2) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    const res = await resetPassword(token, formData);
    if (res.success) {
      setSuccessMsg('Contraseña actualizada con éxito. Ahora podés iniciar sesión.');
      setTimeout(() => navigate('/login'), 2000);
    } else {
      setError(res.message || 'Error al restablecer la contraseña.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md mt-10">
      <h2 className="text-2xl font-bold mb-6 text-center">Restablecer Contraseña</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="password"
          name="new_password_1"
          placeholder="Nueva contraseña"
          value={formData.new_password_1}
          onChange={handleChange}
          className="w-full px-4 py-2 border rounded-md"
          required
        />
        <input
          type="password"
          name="new_password_2"
          placeholder="Repetir contraseña"
          value={formData.new_password_2}
          onChange={handleChange}
          className="w-full px-4 py-2 border rounded-md"
          required
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {successMsg && <p className="text-green-600 text-sm">{successMsg}</p>}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
        >
          Confirmar nueva contraseña
        </button>
      </form>
    </div>
  );
};

export default ResetPasswordPage;
