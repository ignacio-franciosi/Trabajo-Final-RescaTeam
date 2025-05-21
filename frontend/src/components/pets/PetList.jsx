import React from 'react';
import PetPetCard from './PetPetCard';

const PetList = ({ pets, onPetClick }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {pets.map(pet => (
        <PetPetCard 
          key={pet.id} 
          pet={pet} 
          onClick={() => onPetClick(pet)}
        />
      ))}
    </div>
  );
};

export default PetList;