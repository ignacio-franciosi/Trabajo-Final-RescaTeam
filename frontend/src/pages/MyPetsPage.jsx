import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getAdoptionPostsByUserId,
  getImagesByAdoptionPostId,
  deleteAdoptionPost,
  deleteAllImagesByPostId,
  markAsAdopted
} from '../services/AdoptionService';
import MyPets from '../components/profile/MyPets';
import ConfirmDeleteModal from '../components/pets/ConfirmDeleteModal';
import ConfirmAdoptedModal from '../components/pets/ConfirmAdoptedModal';


const MyPetsPage = () => {
  const { user } = useAuth();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState('delete'); // 'delete' o 'adopt'
  const [petSelected, setPetSelected] = useState(null);

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
                ? imageRes.data[0].file_path
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
    setModalAction('delete');
    setPetSelected(pet);
    setShowModal(true);
  };

  const handleMarkAdoptedClick = (pet) => {
    setModalAction('adopt');
    setPetSelected(pet);
    setShowModal(true);
  };

  const handleConfirmAction = async () => {
    if (!petSelected) return;

    try {
      if (modalAction === 'delete') {
        await deleteAllImagesByPostId(petSelected.id_adoption_post);
        await deleteAdoptionPost(petSelected.id_adoption_post);
      } else if (modalAction === 'adopt') {
        const res = await markAsAdopted(petSelected.id_adoption_post);
        if (!res.success) throw new Error(res.message);
        await deleteAllImagesByPostId(petSelected.id_adoption_post);
        await deleteAdoptionPost(petSelected.id_adoption_post);
      }

      setPets(prev => prev.filter(p => p.id_adoption_post !== petSelected.id_adoption_post));
    } catch (err) {
      alert('Error al realizar la acción.');
    } finally {
      setShowModal(false);
      setPetSelected(null);
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
        onMarkAdopted={handleMarkAdoptedClick}
      />

      <ConfirmDeleteModal
        isOpen={showModal}
        onCancel={() => setShowModal(false)}
        onConfirm={handleConfirmAction}
        message={
          modalAction === 'adopt'
            ? 'Al marcar como adoptada se eliminará la publicación. ¿Estás seguro?'
            : '¿Estás seguro de que deseas eliminar esta publicación?'
        }
      />

      <ConfirmAdoptedModal
        isOpen={modalAction === 'adopt' && showModal}
        onCancel={() => setShowModal(false)}
        onConfirm={handleConfirmAction}
      />
    </>
  );
};

export default MyPetsPage;
