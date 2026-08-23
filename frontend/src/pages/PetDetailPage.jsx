import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import PetDetail from '../components/pets/PetDetail';
import { getPostById, getImagesByPostId } from '../services/PostService';

const PetDetailPage = () => {
  const { id } = useParams();
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPet = async () => {
      try {
  const petRes = await getPostById(id);
  const imagesRes = await getImagesByPostId(id);

        if (!petRes.success) throw new Error('No se encontró la publicación');

        const petData = {
          ...petRes.data,
          imagenes: imagesRes.success ? imagesRes.data : [],
        };

        setPet(petData);
        setLoading(false);
      } catch (err) {
        console.error('Error cargando detalle:', err.message);
        setError('Error al cargar el detalle de la mascota.');
        setLoading(false);
      }
    };

    fetchPet();
  }, [id]);

  if (loading) return <p className="text-center text-gray-600">Cargando detalle...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;
  if (!pet) return <p className="text-center text-gray-600">Mascota no encontrada.</p>;

  return <PetDetail pet={pet} />;
};

export default PetDetailPage;



