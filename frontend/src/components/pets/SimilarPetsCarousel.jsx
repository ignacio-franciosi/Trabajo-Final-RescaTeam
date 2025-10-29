import { useEffect, useState, useRef } from 'react';
import PetCard from './PetCard';
import {
  getPostById,
  getImagesByPostId,
} from '../../services/PostService';
import { getSimilarPets } from '../../services/SearchService';

const SimilarPetsCarousel = ({ postId, postType }) => {
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
        const res = await getSimilarPets(postId, postType);
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

  return (
    <div className="mt-10 relative">
      <h3 className="text-xl font-semibold mb-4">Mascotas parecidas</h3>
      {/* Flecha izquierda */}
      <button
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white bg-opacity-80 hover:bg-opacity-100 p-2 rounded-full shadow-md"
      >
        ◀
      </button>
      {/* Flecha derecha */}
      <button
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white bg-opacity-80 hover:bg-opacity-100 p-2 rounded-full shadow-md"
      >
        ▶
      </button>

      <div
        ref={carouselRef}
        className="flex gap-4 overflow-x-auto pb-2 scroll-smooth scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
      >
        {similarPets.map((pet) => (
          <div key={pet.postId} className="flex-shrink-0 w-64">
            <PetCard pet={pet} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimilarPetsCarousel;
