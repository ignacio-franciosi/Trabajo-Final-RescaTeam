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
    telefono: ''
  });

  const [errors, setErrors] = useState({});
  const [backendError, setBackendError] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const requiredFields = ['nombre', 'apellido', 'dni', 'email', 'password', 'telefono'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const fieldErrors = validateRequiredFields(formData, requiredFields);

    if (formData.email && !validateEmail(formData.email)) {
      fieldErrors.email = 'Formato de correo electrónico inválido.';
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      fieldErrors.password = passwordError;
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
        phone: formData.telefono,
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
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Registrarse</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {requiredFields.map((field) => (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-700 capitalize">
              {field === 'telefono' ? 'Teléfono' : field}
            </label>
            <input
              type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
              name={field}
              value={formData[field]}
              onChange={handleChange}
              className={`w-full mt-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${errors[field] ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                }`}
            />
            {errors[field] && <p className="text-red-500 text-xs mt-1">{errors[field]}</p>}
          </div>
        ))}

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
