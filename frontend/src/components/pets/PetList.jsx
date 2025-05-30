import React, { useEffect, useState } from 'react';
import PetCard from './PetCard';
import { getAllAdoptionPosts, getImagesByAdoptionPostId } from '../../services/AdoptionService';

const PetList = () => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPetsWithImages = async () => {
      try {
        const res = await getAllAdoptionPosts();
        if (!res.success || !Array.isArray(res.data)) {
          throw new Error('No se pudieron obtener las publicaciones');
        }

        const postsWithImages = await Promise.all(
          res.data.map(async (post) => {
            const imageRes = await getImagesByAdoptionPostId(post.id_adoption_post);

            if (imageRes.success && Array.isArray(imageRes.data) && imageRes.data.length > 0) {
              const rawPath = imageRes.data[0].file_path;
              const imageUrl = `http://localhost:8090${rawPath.startsWith('/') ? '' : '/'}${rawPath}`;
              post.foto = imageUrl;
            } else {
              post.foto = '/no-image.png'; // imagen por defecto
            }

            return post;
          })
        );

        setPets(postsWithImages);
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar mascotas:', err.message);
        setError('No se encontraron mascotas. Verifica el backend o las imágenes.');
        setLoading(false);
      }
    };

    fetchPetsWithImages();
  }, []);

  if (loading) {
    return <p className="text-center text-gray-600">Cargando mascotas...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500">{error}</p>;
  }

  if (pets.length === 0) {
    return <p className="text-center text-gray-600">No hay mascotas disponibles actualmente.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {pets.map((pet) => (
        <PetCard key={pet.id_adoption_post} pet={pet} onClick={() => {}} />
      ))}
    </div>
  );
};

export default PetList;
