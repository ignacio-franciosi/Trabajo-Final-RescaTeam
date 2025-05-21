import React from 'react';

const PetDetail = ({ pet }) => {
  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/2">
          <img 
            src={pet.foto} 
            alt={pet.nombre || 'Mascota'} 
            className="w-full rounded-lg object-cover"
          />
        </div>
        <div className="md:w-1/2 space-y-4">
          <h2 className="text-3xl font-bold">{pet.nombre || 'Sin nombre'}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Especie</p>
              <p className="capitalize">{pet.especie}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Edad</p>
              <p>{pet.edad} años</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tamaño</p>
              <p className="capitalize">{pet.tamaño}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Raza</p>
              <p>{pet.raza}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Sexo</p>
              <p className="capitalize">{pet.sexo}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Color</p>
              <p>{pet.color}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Castrado</p>
              <p>{pet.castrado ? 'Sí' : 'No'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Vacunas</p>
              <p>{pet.vacunas ? 'Completas' : 'Incompletas'}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">Estado de salud</p>
            <p>{pet.salud}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Zona</p>
            <p>{pet.zona}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Teléfono de contacto</p>
            <p>{pet.telefono}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Descripción</p>
            <p className="text-gray-800">{pet.descripcion}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetDetail;