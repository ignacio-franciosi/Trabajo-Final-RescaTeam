export const validateEmail = (email) => {
  // Expresión regular básica para validar formato de email
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

export const validatePassword = (password) => {
  if (password.length < 8) {
    return "La contraseña debe tener al menos 8 caracteres.";
  }
  if (!/[A-Z]/.test(password)) {
    return "La contraseña debe contener al menos una mayúscula.";
  }
  if (!/[a-z]/.test(password)) {
    return "La contraseña debe contener al menos una minúscula.";
  }
  if (!/[0-9]/.test(password)) {
    return "La contraseña debe contener al menos un número.";
  }
  return null; // Retorna null si es válida
};

export const validateRequiredFields = (formData, requiredFields) => {
  const errors = {};
  requiredFields.forEach(field => {
    if (!formData[field] || formData[field].trim() === '') {
      errors[field] = 'Este campo es obligatorio.';
    }
  });
  return errors;
};