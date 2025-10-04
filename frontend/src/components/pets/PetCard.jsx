import { useNavigate } from 'react-router-dom';

const PetCard = ({ pet }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    const id = pet.postId || pet.id;
    if (!id) return;
    const currentPath = window.location.pathname;
    navigate(`/mascota/${id}`, { state: { origin: currentPath } });
  };

  return (
    <div
      onClick={handleClick}
      className="cursor-pointer bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
    >
      <div className="relative w-full aspect-[4/3] bg-gray-100 flex items-center justify-center overflow-hidden">
        <img
          src={pet.foto || '/no-image.png'}
          alt={pet.name || 'Mascota'}
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e)=>{ e.target.src='/no-image.png'; e.target.className='absolute inset-0 w-full h-full object-contain p-2'; }}
        />
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg">{pet.name || 'Sin nombre'}</h3>
        <p className="text-gray-600">{pet.age} años - {pet.species?.charAt(0).toUpperCase() + pet.species?.slice(1).toLowerCase()}</p>
        <p className="text-gray-500 text-sm">{pet.zone}</p>
      </div>
    </div>
  );
};

export default PetCard;
