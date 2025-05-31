import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAdoptionPostsByUserId, getImagesByAdoptionPostId } from '../services/AdoptionService';
import MyPets from '../components/profile/MyPets';

const MyPetsPage = () => {
  const { user } = useAuth();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMyPets = async () => {
      if (!user) return;

      try {
        const res = await getAdoptionPostsByUserId(user.userId);

        if (!res.success) {
          throw new Error(res.message);
        }

        // Agregar imágenes a cada mascota
        const postsWithImages = await Promise.all(
          res.data.map(async (post) => {
            const imageRes = await getImagesByAdoptionPostId(post.id_adoption_post);
            const imageUrl =
              imageRes.success && imageRes.data.length > 0
                ? `http://localhost:8090${imageRes.data[0].file_path}`
                : '/no-image.png';

            return {
              ...post,
              foto: imageUrl,
              adopted: post.adoptionStatus,
            };
          })
        );

        setPets(postsWithImages);
      } catch (err) {
        console.error('Error cargando mis mascotas:', err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMyPets();
  }, [user]);

  if (!user) return <p className="text-center text-gray-600">Debes iniciar sesión.</p>;
  if (loading) return <p className="text-center text-gray-600">Cargando publicaciones...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return <MyPets pets={pets} onEdit={() => {}} onDelete={() => {}} onMarkAdopted={() => {}} />;
};

export default MyPetsPage;
