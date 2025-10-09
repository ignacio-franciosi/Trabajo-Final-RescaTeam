import React from 'react';
import { useNavigate } from 'react-router-dom';
import PetCard from '../pets/PetCard';

const MyPets = ({ pets, onDelete, onMarkAdopted, disabled = false }) => {
  const navigate = useNavigate();

  const handleEdit = (pet) => {
    navigate(`/editar-publicacion/${pet.postId || pet.id}`);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Mis Publicaciones</h2>
      {pets.length === 0 ? (
        <p className="text-center text-gray-600">Aún no has publicado ninguna mascota.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {pets.map((pet, index) => (
            <div key={pet.postId || pet.id || index} className="border rounded-lg overflow-hidden">
              <PetCard pet={pet} onClick={() => { }} />
              <div className="p-4 bg-gray-50 flex justify-around space-x-2">
                <button
                  onClick={() => !disabled && handleEdit(pet)}
                  disabled={disabled}
                  className={`flex-1 bg-blue-600 text-white py-2 px-4 rounded-md text-sm transition-colors ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-yellow-600'}`}
                  title={disabled ? 'Cuenta suspendida' : ''}
                >
                  Editar
                </button>
                <button
                  onClick={() => !disabled && onDelete(pet)}
                  disabled={disabled}
                  className={`flex-1 bg-blue-600 text-white py-2 px-4 rounded-md text-sm transition-colors ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-red-700'}`}
                  title={disabled ? 'Cuenta suspendida' : ''}
                >
                  Eliminar
                </button>
                {!pet.adopted && (
                  <button
                    onClick={() => !disabled && onMarkAdopted(pet)}
                    disabled={disabled}
                    className={`flex-1 bg-blue-600 text-white py-2 px-4 rounded-md text-sm transition-colors ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-green-700'}`}
                    title={disabled ? 'Cuenta suspendida' : ''}
                  >
                    Marcar Resuelto
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
