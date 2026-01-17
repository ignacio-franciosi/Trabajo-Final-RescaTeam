import React, { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SuspendedNotice from '../components/common/SuspendedNotice';
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
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const [filterType, setFilterType] = useState(params.get('type') || 'adoption'); // 'adoption', 'lost', 'found', 'resolved'

  const fetchMyPets = useCallback(async () => {
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
    } catch (e) {
      console.error('Error cargando mis mascotas:', e?.message);
      setError(e?.message || 'Ocurrió un error inesperado.');
      setPets([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMyPets();
  }, [fetchMyPets]);

  const handleDeleteClick = (pet) => {
    // Bloquear si el usuario está suspendido
    if (user?.suspended) {
      alert('No puedes eliminar publicaciones mientras tu cuenta está suspendida');
      return;
    }
    setModalAction('delete');
    setPetSelected(pet);
    setShowModal(true);
  };

  const handleMarkAdoptedClick = (pet) => {
    // Bloquear si el usuario está suspendido
    if (user?.suspended) {
      alert('No puedes marcar publicaciones como resueltas mientras tu cuenta está suspendida');
      return;
    }
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
        setPets(prev => prev.filter(p => p.postId !== petSelected.postId));
      } else if (modalAction === 'resolve') {
        const res = await markAsResolved(petSelected.postId);
        if (!res.success) throw new Error(res.message);
        // Actualizar el estado local de la publicación marcada como resuelta
        setPets(prev => prev.map(p =>
          p.postId === petSelected.postId
            ? { ...p, postStatus: true, adopted: true }
            : p
        ));
      }
    } catch {
      alert('Error al realizar la acción.');
    } finally {
      setShowModal(false);
      setPetSelected(null);
    }
  };

  if (!user) return <p className="text-center text-gray-600">Debes iniciar sesión.</p>;
  if (loading) return <p className="text-center text-gray-600">Cargando publicaciones...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  // Separar publicaciones activas y resueltas
  const activePets = pets.filter(pet => pet.postStatus !== true);
  const resolvedPets = pets.filter(pet => pet.postStatus === true);

  // Filtrar mascotas por tipo
  let filteredPets = [];
  if (filterType === 'resolved') {
    // Mostrar todas las resueltas sin importar el tipo
    filteredPets = resolvedPets;
  } else {
    // Filtrar por tipo de publicación (adoption, lost, found) solo entre activas
    filteredPets = activePets.filter(pet => pet.postType === filterType);
  }

  return (
    <>
      {user?.suspended && <SuspendedNotice small />}

      {/* Filtro por tipo de publicación */}
      <div className="max-w-4xl mx-auto px-6 pt-6">
        <div className="flex flex-wrap gap-3 justify-center mb-6">
          <button
            onClick={() => setFilterType('adoption')}
            className={`px-4 py-2 rounded-full font-semibold transition-all flex items-center gap-2 ${filterType === 'adoption'
              ? 'bg-emerald-500 text-white shadow-md'
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            Adopción ({activePets.filter(p => p.postType === 'adoption').length})
          </button>
          <button
            onClick={() => setFilterType('lost')}
            className={`px-4 py-2 rounded-full font-semibold transition-all flex items-center gap-2 ${filterType === 'lost'
              ? 'bg-red-500 text-white shadow-md'
              : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
              }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Perdidos ({activePets.filter(p => p.postType === 'lost').length})
          </button>
          <button
            onClick={() => setFilterType('found')}
            className={`px-4 py-2 rounded-full font-semibold transition-all flex items-center gap-2 ${filterType === 'found'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
              }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Encontrados ({activePets.filter(p => p.postType === 'found').length})
          </button>
          <button
            onClick={() => setFilterType('resolved')}
            className={`px-4 py-2 rounded-full font-semibold transition-all flex items-center gap-2 ${filterType === 'resolved'
              ? 'bg-gray-600 text-white shadow-md'
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-300'
              }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Resueltas ({resolvedPets.length})
          </button>
        </div>
      </div>

      <MyPets
        pets={filteredPets}
        disabled={!!user?.suspended}
        isResolved={filterType === 'resolved'}
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
