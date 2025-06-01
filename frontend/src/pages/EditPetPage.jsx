import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import EditPetForm from '../components/pets/EditPetForm';
import { getAdoptionPostById, getImagesByAdoptionPostId } from '../services/AdoptionService';

const EditPetPage = () => {
  const { id } = useParams();
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPet = async () => {
      try {
        const petRes = await getAdoptionPostById(id);
        const imgRes = await getImagesByAdoptionPostId(id);

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

  return <EditPetForm pet={pet} />;
};

export default EditPetPage;

/*
import React from 'react';
import EditPetForm from '../components/pets/EditPetForm';

const EditPetPage = () => {
  return (
    <div className="min-h-screen py-10 px-4 bg-gray-50">
      <EditPetForm />
    </div>
  );
};

export default EditPetPage;
*/