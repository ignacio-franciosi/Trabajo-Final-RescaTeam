import { useEffect, useState, useRef } from 'react';
import PetCard from './PetCard';
import {
  getPostById,
  getImagesByPostId,
} from '../../services/PostService';
import { getSimilarPets } from '../../services/SearchService';

const SimilarPetsCarousel = ({ postId, postType, petName, species }) => {
  const [loading, setLoading] = useState(true);
  const [similarPets, setSimilarPets] = useState([]);
  const [error, setError] = useState(null);
  const carouselRef = useRef(null);

  useEffect(() => {
    if (!postId || !postType) return;

    const fetchSimilar = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await getSimilarPets(postId, postType, species);
        if (!res.success || !res.data.matches || res.data.matches.length === 0) {
          setSimilarPets([]);
          setLoading(false);
          return;
        }

        const petsData = [];
        for (const matchId of res.data.matches) {
          const resPost = await getPostById(matchId);
          if (resPost.success) {
            const post = resPost.data;
            const resImages = await getImagesByPostId(matchId);
            const firstImage = resImages.success
              ? resImages.data?.[0]?.filepath
              : null;

            petsData.push({
              ...post,
              foto: firstImage || null,
            });
          }
        }

        setSimilarPets(petsData);
      } catch (err) {
        console.error('Error buscando similares:', err);
        setError('No se pudieron cargar mascotas parecidas.');
      } finally {
        setLoading(false);
      }
    };

    fetchSimilar();
  }, [postId, postType]);

  const scroll = (direction) => {
    if (!carouselRef.current) return;
    const width = carouselRef.current.offsetWidth;
    carouselRef.current.scrollBy({ left: direction === 'left' ? -width : width, behavior: 'smooth' });
  };

  console.log('similarPets state:', similarPets);
  if (loading) return <div className="mt-8 text-center text-gray-500">Buscando mascotas parecidas…</div>;
  if (error) return <div className="mt-8 text-center text-red-600">{error}</div>;
  if (similarPets.length === 0) return <div className="mt-8 text-center text-gray-500">Nuestro asistente de IA aún no encontró mascotas parecidas.</div>;

  const displayName = petName || 'esta mascota';

  return (
    <div className="mt-10 mb-16 w-full flex justify-center">
      <div className="relative w-full max-w-5xl">
        {/* Flecha izquierda alineada al borde del cuadro */}
        <button
          onClick={() => scroll('left')}
          aria-label="Ver anteriores"
          className="absolute left-0 top-1/2 -translate-y-1/2 bg-white bg-opacity-90 hover:bg-blue-100 text-blue-600 hover:text-blue-800 p-2 rounded-full shadow-lg border border-blue-200 transition-all duration-200 group z-10"
          style={{ minWidth: 44, minHeight: 44 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div
          className="w-full flex flex-col"
          style={{
            backgroundColor: '#F2F7FF',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
            padding: '28px'
          }}
        >
          <h3 className="text-xl font-bold mb-2 text-left" style={{ color: '#111827', fontSize: '22px' }}>Mascotas parecidas a {displayName}</h3>
          <p className="font-medium mb-6" style={{ color: '#2563EB', fontSize: '16px' }}>Coincidencias detectadas con IA 🤖</p>
          <div
            ref={carouselRef}
            className="flex gap-8 overflow-x-auto pb-2 pt-2 scroll-smooth scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-transparent"
          >
            {similarPets.map((pet) => (
              <div key={pet.postId} className="flex-shrink-0 w-64">
                <PetCard pet={pet} />
              </div>
            ))}
          </div>
        </div>
        {/* Flecha derecha alineada al borde del cuadro */}
        <button
          onClick={() => scroll('right')}
          aria-label="Ver siguientes"
          className="absolute right-0 top-1/2 -translate-y-1/2 bg-white bg-opacity-90 hover:bg-blue-100 text-blue-600 hover:text-blue-800 p-2 rounded-full shadow-lg border border-blue-200 transition-all duration-200 group z-10"
          style={{ minWidth: 44, minHeight: 44 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default SimilarPetsCarousel;
