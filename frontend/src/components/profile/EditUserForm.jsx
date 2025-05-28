import React, { useState } from 'react';

const EditUserForm = ({ initialData, onSave, onCancel }) => {
  const [formData, setFormData] = useState({ 
    //...initialData 
    name: initialData?.name || '',
    surname: initialData?.surname || '',
    dni: initialData?.dni || '',
    email: initialData?.email || '',
    phone: initialData?.phone || ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const dataToSend = {
        ...formData,
        dni: parseInt(formData.dni),
    };

    const res = await onSave(dataToSend);
    if (!res.success) {
        setError(res.message || 'Error al actualizar usuario');
    }
  };


  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Editar Perfil</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {['name', 'surname', 'dni', 'email', 'phone'].map((field) => (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-700 capitalize">{field}</label>
            <input
              type={field === 'email' ? 'email' : 'text'}
              name={field}
              value={formData[field] || ''}
              onChange={handleChange}
              className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md"
            />
          </div>
        ))}
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex justify-between mt-4">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Guardar
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditUserForm;
