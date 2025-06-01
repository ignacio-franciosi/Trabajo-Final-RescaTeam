import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getAdoptionPostsByUserId,
  getImagesByAdoptionPostId,
  deleteAdoptionPost,
  deleteAllImagesByPostId
} from '../services/AdoptionService';
import MyPets from '../components/profile/MyPets';
import ConfirmDeleteModal from '../components/pets/ConfirmDeleteModal';

const MyPetsPage = () => {
  const { user } = useAuth();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [petToDelete, setPetToDelete] = useState(null);

  const fetchMyPets = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const res = await getAdoptionPostsByUserId(user.userId);

      if (!res.success || !Array.isArray(res.data)) {
        throw new Error(res.message || 'Error al obtener publicaciones.');
      }

      const postsWithImages = await Promise.all(
        res.data.map(async (post) => {
          try {
            const imageRes = await getImagesByAdoptionPostId(post.id_adoption_post);
            const imageUrl =
              imageRes.success && Array.isArray(imageRes.data) && imageRes.data.length > 0
                ? `http://localhost:8090${imageRes.data[0].file_path}`
                : '/no-image.png';

            return {
              ...post,
              foto: imageUrl,
              adopted: post.adoptionStatus,
            };
          } catch {
            return {
              ...post,
              foto: '/no-image.png',
              adopted: post.adoptionStatus,
            };
          }
        })
      );

      setPets(postsWithImages);
    } catch (err) {
      console.error('Error cargando mis mascotas:', err.message);
      setError(err.message || 'Ocurrió un error inesperado.');
      setPets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyPets();
  }, [user]);

  const handleDeleteClick = (pet) => {
    setPetToDelete(pet);
    setShowModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!petToDelete) return;

    try {
      await deleteAllImagesByPostId(petToDelete.id_adoption_post);
      await deleteAdoptionPost(petToDelete.id_adoption_post);
      setPets(prev => prev.filter(p => p.id_adoption_post !== petToDelete.id_adoption_post));
    } catch (err) {
      alert('Error al eliminar la publicación.');
    } finally {
      setShowModal(false);
      setPetToDelete(null);
    }
  };

  if (!user) return <p className="text-center text-gray-600">Debes iniciar sesión.</p>;
  if (loading) return <p className="text-center text-gray-600">Cargando publicaciones...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <>
      <MyPets
        pets={pets}
        onEdit={(pet) => (window.location.href = `/editar-publicacion/${pet.id_adoption_post}`)}
        onDelete={handleDeleteClick}
        onMarkAdopted={() => {}}
      />
      <ConfirmDeleteModal
        isOpen={showModal}
        onCancel={() => setShowModal(false)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};

export default MyPetsPage;
