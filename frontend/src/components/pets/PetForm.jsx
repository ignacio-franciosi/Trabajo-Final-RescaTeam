import React, { useState } from 'react';

const PetForm = ({ onSubmit }) => {
  const [petData, setPetData] = useState({
    nombre: '',
    especie: 'perro',
    edad: '',
    tamaño: 'mediano',
    raza: '',
    sexo: 'macho',
    color: '',
    salud: '',
    castrado: false,
    vacunas: false,
    zona: '',
    telefono: '',
    descripcion: '',
    foto: ''
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPetData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(petData);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Publicar Mascota</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre (opcional)</label>
            <input
              type="text"
              name="nombre"
              value={petData.nombre}
              onChange={handleChange}
              className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Especie</label>
            <select
              name="especie"
              value={petData.especie}
              onChange={handleChange}
              className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="perro">Perro</option>
              <option value="gato">Gato</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Edad</label>
            <input
              type="number"
              name="edad"
              value={petData.edad}
              onChange={handleChange}
              className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Tamaño</label>
            <select
              name="tamaño"
              value={petData.tamaño}
              onChange={handleChange}
              className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pequeño">Pequeño</option>
              <option value="mediano">Mediano</option>
              <option value="grande">Grande</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Raza</label>
            <input
              type="text"
              name="raza"
              value={petData.raza}
              onChange={handleChange}
              className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Sexo</label>
            <select
              name="sexo"
              value={petData.sexo}
              onChange={handleChange}
              className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="macho">Macho</option>
              <option value="hembra">Hembra</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Color</label>
            <input
              type="text"
              name="color"
              value={petData.color}
              onChange={handleChange}
              className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Estado de salud</label>
            <input
              type="text"
              name="salud"
              value={petData.salud}
              onChange={handleChange}
              className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              name="castrado"
              checked={petData.castrado}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">Castrado</label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              name="vacunas"
              checked={petData.vacunas}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">Vacunas completas</label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Zona</label>
            <input
              type="text"
              name="zona"
              value={petData.zona}
              onChange={handleChange}
              className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Teléfono de contacto</label>
            <input
              type="text"
              name="telefono"
              value={petData.telefono}
              onChange={handleChange}
              className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Descripción</label>
          <textarea
            name="descripcion"
            value={petData.descripcion}
            onChange={handleChange}
            rows="3"
            className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          ></textarea>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Foto URL</label>
          <input
            type="text"
            name="foto"
            value={petData.foto}
            onChange={handleChange}
            className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          Publicar Mascota
        </button>
      </form>
    </div>
  );
};

export default PetForm;