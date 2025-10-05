import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPostById, getImagesByPostId } from '../services/PostService';
import EditAdoptionForm from '../components/pets/EditAdoptionForm';
import EditLostFoundForm from '../components/pets/EditLostFoundForm';

const EditPetPage = () => {
  const { id } = useParams();
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPet = async () => {
      try {
  const petRes = await getPostById(id);
  const imgRes = await getImagesByPostId(id);

        if (!petRes.success) throw new Error('No se encontró la publicación');

        const petData = {
          ...petRes.data,
          imagenes: imgRes.success ? imgRes.data : [],
        };

        setPet(petData);
      } catch (err) {
        console.error(err);
        setError('Error al cargar la publicación');
      } finally {
        setLoading(false);
      }
    };

    fetchPet();
  }, [id]);

  if (loading) return <p className="text-center">Cargando publicación...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;
  if (!pet) return <p className="text-center">Mascota no encontrada</p>;

  // Selección dinámica del formulario según postType
  if (pet.postType === 'adoption') {
    return <EditAdoptionForm post={pet} />;
  }
  if (pet.postType === 'lost' || pet.postType === 'found') {
    return <EditLostFoundForm post={pet} />;
  }
  return <p className="text-center">Tipo de publicación no soportado.</p>;
};

export default EditPetPage;
