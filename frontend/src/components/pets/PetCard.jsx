import React from 'react';

const PetCard = ({ pet, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="cursor-pointer bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
    >
      <img 
        src={pet.foto} 
        alt={pet.nombre || 'Mascota'} 
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <h3 className="font-bold text-lg">{pet.nombre || 'Sin nombre'}</h3>
        <p className="text-gray-600">{pet.edad} años - {pet.especie}</p>
        <p className="text-gray-500 text-sm">{pet.zona}</p>
      </div>
    </div>
  );
};

export default PetCard;