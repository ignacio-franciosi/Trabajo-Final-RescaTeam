import React, { useState } from 'react';

const FilterPanel = ({ onFilterChange }) => {
  const [filters, setFilters] = useState({
    especie: '',
    edad: '',
    tamaño: '',
    sexo: '',
    castrado: '',
    vacunas: '',
    zona: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    onFilterChange(filters);
  };

  const handleClearFilters = () => {
    const emptyFilters = {
      especie: '',
      edad: '',
      tamaño: '',
      sexo: '',
      castrado: '',
      vacunas: '',
      zona: ''
    };
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md space-y-4">
      <h3 className="text-lg font-bold mb-2">Filtrar Mascotas</h3>
      <div>
        <label className="block text-sm font-medium text-gray-700">Especie</label>
        <select name="especie" value={filters.especie} onChange={handleChange} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md">
          <option value="">Todas</option>
          <option value="perro">Perro</option>
          <option value="gato">Gato</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Edad</label>
        <select name="edad" value={filters.edad} onChange={handleChange} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md">
          <option value="">Cualquiera</option>
          <option value="0-1">0-1 año</option>
          <option value="2-3">2-3 años</option>
          <option value="4-7">4-7 años</option>
          <option value="8+">8+ años</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Tamaño</label>
        <select name="tamaño" value={filters.tamaño} onChange={handleChange} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md">
          <option value="">Cualquiera</option>
          <option value="pequeño">Pequeño</option>
          <option value="mediano">Mediano</option>
          <option value="grande">Grande</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Sexo</label>
        <select name="sexo" value={filters.sexo} onChange={handleChange} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md">
          <option value="">Cualquiera</option>
          <option value="macho">Macho</option>
          <option value="hembra">Hembra</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Castrado</label>
        <select name="castrado" value={filters.castrado} onChange={handleChange} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md">
          <option value="">Cualquiera</option>
          <option value="true">Sí</option>
          <option value="false">No</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Vacunas completas</label>
        <select name="vacunas" value={filters.vacunas} onChange={handleChange} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md">
          <option value="">Cualquiera</option>
          <option value="true">Sí</option>
          <option value="false">No</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Zona</label>
        <input
          type="text"
          name="zona"
          value={filters.zona}
          onChange={handleChange}
          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>
      <div className="flex space-x-2">
        <button
          onClick={handleApplyFilters}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          Aplicar Filtros
        </button>
        <button
          onClick={handleClearFilters}
          className="w-full bg-gray-300 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
        >
          Limpiar
        </button>
      </div>
    </div>
  );
};

export default FilterPanel;