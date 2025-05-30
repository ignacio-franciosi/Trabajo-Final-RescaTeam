import { useNavigate } from 'react-router-dom';

const PetCard = ({ pet }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/mascota/${pet.id_adoption_post}`);
  };

  return (
    <div
      onClick={handleClick}
      className="cursor-pointer bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
    >
      <img
        src={pet.foto}
        alt={pet.name || 'Mascota'}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <h3 className="font-bold text-lg">{pet.name || 'Sin nombre'}</h3>
        <p className="text-gray-600">{pet.age} años - {pet.species}</p>
        <p className="text-gray-500 text-sm">{pet.zone}</p>
      </div>
    </div>
  );
};

export default PetCard;
