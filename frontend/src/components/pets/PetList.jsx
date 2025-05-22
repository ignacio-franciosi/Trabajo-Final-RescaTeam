import React from 'react';
import PetCard from '../pets/PetCard';

const PetList = ({ pets, onPetClick }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {pets.map(pet => (
        <PetCard 
          key={pet.id} 
          pet={pet} 
          onClick={() => onPetClick(pet)}
        />
      ))}
    </div>
  );
};

export default PetList;