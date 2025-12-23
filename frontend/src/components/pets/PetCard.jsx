import { useNavigate } from 'react-router-dom';

const PetCard = ({ pet }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    const id = pet.postId || pet.id;
    if (!id) return;
    const currentPath = window.location.pathname;
    navigate(`/mascota/${id}`, { state: { origin: currentPath } });
  };

  // Configuración de estilos por tipo de publicación
  const getTypeStyles = () => {
    switch (pet.postType) {
      case 'adoption':
        return {
          badge: 'bg-emerald-500',
          border: 'border-t-4 border-emerald-500',
          text: 'En adopción',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          )
        };
      case 'lost':
        return {
          badge: 'bg-red-500',
          border: 'border-t-4 border-red-500',
          text: 'Perdido',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )
        };
      case 'found':
        return {
          badge: 'bg-blue-500',
          border: 'border-t-4 border-blue-500',
          text: 'Encontrado',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )
        };
      default:
        return {
          badge: 'bg-gray-500',
          border: 'border-t-4 border-gray-500',
          text: 'Mascota',
          icon: null
        };
    }
  };

  const typeStyles = getTypeStyles();

  return (
    <div
      onClick={handleClick}
      className={`cursor-pointer bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow ${typeStyles.border}`}
    >
      <div className="relative w-full aspect-[4/3] bg-gray-100 flex items-center justify-center overflow-hidden">
        {/* Badge tipo de publicación */}
        <div className={`absolute top-2 left-2 ${typeStyles.badge} text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md flex items-center gap-1.5 z-10`}>
          {typeStyles.icon}
          {typeStyles.text}
        </div>
        <img
          src={pet.foto || '/no-image.png'}
          alt={pet.name || 'Mascota'}
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => { e.target.src = '/no-image.png'; e.target.className = 'absolute inset-0 w-full h-full object-contain p-2'; }}
        />
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg">{pet.name || 'Sin nombre'}</h3>
        {(() => {
          const parts = [];
          const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '');
          if (pet.postType === 'adoption') {
            if (pet.age !== undefined && pet.age !== null && pet.age !== '') parts.push(`${pet.age} años`);
            if (pet.sex) parts.push(cap(pet.sex));
            if (pet.species) parts.push(cap(pet.species));
          } else { // lost / found u otros
            if (pet.sex) parts.push(cap(pet.sex));
            if (pet.species) parts.push(cap(pet.species));
          }
          return <p className="text-gray-600">{parts.join(' • ')}</p>;
        })()}
        <p className="text-gray-500 text-sm">{pet.zone}</p>
      </div>
    </div>
  );
};

export default PetCard;
