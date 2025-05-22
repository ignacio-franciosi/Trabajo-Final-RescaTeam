import React from 'react';
import PetCard from '../pets/PetCard';

const MyPets = ({ pets, onEdit, onDelete, onMarkAdopted }) => {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Mis Publicaciones</h2>
      {pets.length === 0 ? (
        <p className="text-center text-gray-600">Aún no has publicado ninguna mascota.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {pets.map(pet => (
            <div key={pet.id} className="border rounded-lg overflow-hidden">
              <PetCard pet={pet} onClick={() => {}} /> {/* No clickable in this view */}
              <div className="p-4 bg-gray-50 flex justify-around space-x-2">
                <button
                  onClick={() => onEdit(pet)}
                  className="flex-1 bg-yellow-500 text-white py-2 px-4 rounded-md text-sm hover:bg-yellow-600 transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => onDelete(pet)}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md text-sm hover:bg-red-700 transition-colors"
                >
                  Eliminar
                </button>
                {!pet.adopted && (
                  <button
                    onClick={() => onMarkAdopted(pet)}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md text-sm hover:bg-green-700 transition-colors"
                  >
                    Marcar Adoptado
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyPets;