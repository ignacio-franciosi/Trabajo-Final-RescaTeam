import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getPostsByUserId,
  getImagesByPostId,
  deletePost,
  deleteAllImagesByPostId,
  markAsResolved
} from '../services/PostService';
import MyPets from '../components/profile/MyPets';
import ConfirmDeleteModal from '../components/pets/ConfirmDeleteModal';
import ConfirmResolvedModal from '../components/pets/ConfirmResolvedModal';


const MyPetsPage = () => {
  const { user } = useAuth();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState('delete'); // 'delete' o 'resolve'
  const [petSelected, setPetSelected] = useState(null);

  const fetchMyPets = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const res = await getPostsByUserId(user.userId);

      if (!res.success || !Array.isArray(res.data)) {
        throw new Error(res.message || 'Error al obtener publicaciones.');
      }

      const postsWithImages = await Promise.all(
        res.data.map(async (post) => {
          try {
            const imageRes = await getImagesByPostId(post.postId || post.id);
            let imageUrl = '/no-image.png';
            if (imageRes.success && Array.isArray(imageRes.data) && imageRes.data.length > 0) {
              const rawPath = imageRes.data[0].filepath;
              if (rawPath && /^https?:\/\//i.test(rawPath)) {
                imageUrl = rawPath;
              } else if (rawPath) {
                imageUrl = `http://localhost:8090${rawPath.startsWith('/') ? '' : '/'}${rawPath}`;
              }
            }

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
    setModalAction('resolve');
    setPetSelected(pet);
    setShowModal(true);
  };

  const handleConfirmAction = async () => {
    if (!petSelected) return;

    try {
      if (modalAction === 'delete') {
        await deleteAllImagesByPostId(petSelected.postId);
        await deletePost(petSelected.postId);
      } else if (modalAction === 'resolve') {
        const res = await markAsResolved(petSelected.postId);
        if (!res.success) throw new Error(res.message);
        await deleteAllImagesByPostId(petSelected.postId);
        await deletePost(petSelected.postId);
      }

      setPets(prev => prev.filter(p => p.postId !== petSelected.postId));
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
        onEdit={(pet) => (window.location.href = `/editar-publicacion/${pet.postId}`)}
        onDelete={handleDeleteClick}
        onMarkAdopted={handleMarkAdoptedClick}
      />

      <ConfirmDeleteModal
        isOpen={showModal}
        onCancel={() => setShowModal(false)}
        onConfirm={handleConfirmAction}
        message={
          modalAction === 'resolve'
            ? 'Al marcar como resuelto, se eliminará la publicación. ¿Estás seguro?'
            : '¿Estás seguro de que deseas eliminar esta publicación?'
        }
      />

      <ConfirmResolvedModal
  isOpen={modalAction === 'resolve' && showModal}
        onCancel={() => setShowModal(false)}
        onConfirm={handleConfirmAction}
      />
    </>
  );
};

export default MyPetsPage;
