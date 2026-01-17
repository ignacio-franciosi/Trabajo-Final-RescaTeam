import React, { useState } from 'react';
import { validateEmail, validatePassword, validateRequiredFields } from '../../utils/validators';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [backendError, setBackendError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const requiredFields = ['nombre', 'apellido', 'dni', 'email', 'password', 'confirmPassword'];
  const fieldLabels = {
    nombre: 'Nombre',
    apellido: 'Apellido',
    dni: 'DNI',
    email: 'Email',
    password: 'Contraseña',
    confirmPassword: 'Confirmar Contraseña'
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const fieldErrors = validateRequiredFields(formData, requiredFields, fieldLabels);

    if (formData.email && !validateEmail(formData.email)) {
      fieldErrors.email = 'Formato de correo electrónico inválido.';
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      fieldErrors.password = passwordError;
    }

    if (formData.password !== formData.confirmPassword) {
      fieldErrors.confirmPassword = 'Las contraseñas no coinciden.';
    }

    setErrors(fieldErrors);
    setBackendError('');

    if (Object.keys(fieldErrors).length === 0) {
      const userPayload = {
        name: formData.nombre,
        surname: formData.apellido,
        dni: parseInt(formData.dni),
        email: formData.email,
        password: formData.password,
        type: false,
        suspended: false
      };

      const result = await register(userPayload);

      if (result.success) {
        const redirectUrl = localStorage.getItem('redirectAfterLogin');
        if (redirectUrl) {
          localStorage.removeItem('redirectAfterLogin');
          setTimeout(() => navigate(redirectUrl), 500);
        } else {
          setTimeout(() => navigate('/'), 500);
        }
      } else {
        setBackendError(result.message || 'Error al registrarse');
      }
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-6 bg-white rounded-lg shadow-md mt-8 sm:mt-16 md:mt-24 mb-8 sm:mb-16 md:mb-24">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center">Registrarse</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">Nombre</label>
          <input
            id="nombre"
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            className={`w-full mt-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${errors.nombre ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
          />
          {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>}
        </div>

        <div>
          <label htmlFor="apellido" className="block text-sm font-medium text-gray-700">Apellido</label>
          <input
            id="apellido"
            type="text"
            name="apellido"
            value={formData.apellido}
            onChange={handleChange}
            className={`w-full mt-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${errors.apellido ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
          />
          {errors.apellido && <p className="text-red-500 text-xs mt-1">{errors.apellido}</p>}
        </div>

        <div>
          <label htmlFor="dni" className="block text-sm font-medium text-gray-700">DNI</label>
          <input
            id="dni"
            type="text"
            name="dni"
            value={formData.dni}
            onChange={handleChange}
            className={`w-full mt-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${errors.dni ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
          />
          {errors.dni && <p className="text-red-500 text-xs mt-1">{errors.dni}</p>}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
          <input
            id="email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full mt-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">Contraseña</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full mt-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${errors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirmar Contraseña</label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full mt-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
            >
              {showConfirmPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
        </div>

        {backendError && (
          <p className="text-red-500 text-sm text-center">{backendError}</p>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          Registrarse
        </button>
        <p className="text-sm text-center text-gray-600">¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">Ingresar</Link>
        </p>
      </form>
    </div>
  );
};

export default RegisterForm;
