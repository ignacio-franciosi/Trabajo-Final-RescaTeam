import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ReportPostModal from '../reports/ReportPostModal';
import { searchBarrioOverpassPoint } from '../../services/overpass';
import MiniLeafletMap from '../map/MiniLeafletMap';
// ⬇️ Import correcto: default export
import ChatService from '../../services/ChatService';
import SimilarPetsCarousel from './SimilarPetsCarousel';

const PetDetail = ({ pet }) => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [currentImage, setCurrentImage] = useState(0);
  const hasImages = pet.imagenes && pet.imagenes.length > 0;
  // Modal para imagen completa
  const [showFullImage, setShowFullImage] = useState(false);
  const location = useLocation();
  const [reportOpen, setReportOpen] = useState(false);

  const handleVolver = () => {
    const origin = location.state?.origin;
    if (origin) {
      navigate(origin);
      return;
    }
    const path = pet.postType === 'adoption'
      ? '/adopcion'
      : pet.postType === 'lost'
        ? '/perdidos'
        : pet.postType === 'found'
          ? '/encontrados'
          : '/';
    navigate(path);
  };

  const handlePrev = () => {
    setCurrentImage((prev) =>
      prev === 0 ? pet.imagenes.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentImage((prev) =>
      prev === pet.imagenes.length - 1 ? 0 : prev + 1
    );
  };

  // INICIAR CHAT (HU1)
  // =======================
  const [startingChat, setStartingChat] = useState(false);
  const [startError, setStartError] = useState(null);

  const ownerId =
    pet?.userId ?? pet?.ownerId ?? pet?.id_user ?? pet?.idUser ?? null;

  const postId =
    pet?.postId ?? pet?.PostId ?? pet?._id ?? pet?.id ?? null;

  const isOwner = user?.userId != null && ownerId != null
    ? String(user.userId) === String(ownerId)
    : false;

  const canStartChat = !!token && !!ownerId && !!postId && !isOwner && !user?.suspended;

  const handleStartChat = async () => {
    if (!canStartChat) return;
    try {
      setStartingChat(true);
      setStartError(null);

      // Normalizamos a string para el DTO del backend
      const payload = {
        receiverId: String(ownerId),
        postId: String(postId),
      };

      const { data } = await ChatService.startChat(token, payload);

      if (data?.chatId) {
        navigate(`/chat/${data.chatId}`);
      } else {
        setStartError('No se obtuvo el chatId del servidor.');
      }
    } catch (err) {
      // Mostramos el mensaje específico si viene del backend
      const apiMsg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'No se pudo iniciar el chat.';
      console.error('[chat/start] error:', err);
      setStartError(apiMsg);
    } finally {
      setStartingChat(false);
    }
  };
  // =======================

  // contactar eliminado del UI

  const [userPos, setUserPos] = useState(null);
  const [barrioPoint, setBarrioPoint] = useState(null);
  const [mapError, setMapError] = useState(null);
  const [mapLoading, setMapLoading] = useState(false);

  const barrioLoadingText = pet.postType === 'lost'
    ? 'Cargando zona de la mascota perdida…'
    : pet.postType === 'found'
      ? 'Cargando zona de la mascota encontrada…'
      : pet.postType === 'adoption'
        ? 'Cargando zona de la mascota en adopción…'
        : 'Cargando zona…';

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
        () => { },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  useEffect(() => {
    const zoneRaw = (pet?.zone || '').trim();
    if (!zoneRaw) return;
    const cleaned = zoneRaw
      .replace(/\bzona\b\s*/i, '')
      .replace(/^\s*b[º°]\s*/i, '')
      .replace(/[.,;]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!cleaned) return;
    const controller = new AbortController();
    let softId;
    let hardId;
    setMapError(null);
    setBarrioPoint(null);
    setMapLoading(true);
    // Mensaje suave si tarda más de 7s
    softId = setTimeout(() => {
      setMapError((prev) => prev || 'Tarda más de lo normal en ubicar el barrio…');
    }, 7000);
    // Corte duro a los ~15s
    hardId = setTimeout(() => {
      controller.abort();
    }, 15000);
    (async () => {
      try {
        const res = await searchBarrioOverpassPoint(cleaned, { signal: controller.signal });
        setBarrioPoint(res);
        setMapError(null);
      } catch (e) {
        if (e?.name === 'AbortError') return;
        setMapError('No se pudo cargar el barrio en el mapa.');
      } finally {
        clearTimeout(softId);
        clearTimeout(hardId);
        setMapLoading(false);
      }
    })();
    return () => {
      controller.abort();
      clearTimeout(softId);
      clearTimeout(hardId);
    };
  }, [pet?.zone]);

  // Build a flat list of detail items and split evenly into two columns
  const details = [];
  const pushDetail = (label, value) => {
    if (value !== undefined && value !== null && value !== '') {
      details.push({ label, value });
    }
  };
  pushDetail('Especie', pet.species);
  if (pet.age !== undefined && pet.age !== null && pet.age !== '') {
    pushDetail('Edad', `${pet.age} años`);
  }
  pushDetail('Tamaño', pet.size);
  pushDetail('Raza', pet.breed);
  pushDetail('Sexo', pet.sex);
  pushDetail('Color', pet.color);
  if (pet.postType === 'adoption') {
    pushDetail('Castrado', pet.neutered ? 'Sí' : 'No');
    pushDetail('Vacunas', pet.completeVaccines ? 'Completas' : 'Incompletas');
  } else {
    pushDetail('Estado de salud', pet.healthStatus);
    pushDetail('Collar', pet.collar ? 'Sí' : 'No');
    pushDetail('Color collar', pet.collarColor);
  }
  pushDetail('Zona', pet.zone);
  if (pet.postType !== 'adoption' && pet.date) {
    pushDetail('Publicado', formatDate(pet.date));
  }

  const mid = Math.ceil(details.length / 2);
  const leftDetails = details.slice(0, mid);
  const rightDetails = details.slice(mid);

  return (
    <div className="relative max-w-5xl mx-auto p-4">
      <button
        onClick={handleVolver}
        className="absolute top-2 left-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition z-20"
      >
        ← Volver al listado
      </button>

      {/* Add top padding to avoid header overlap */}
      <div className="mt-12 pt-10 p-6 bg-white rounded-lg shadow-md">
        {/* Título grande según tipo de publicación */}
        <h1 className="text-4xl font-bold text-center mb-16 text-black tracking-tight" style={{ fontFamily: "'Poppins', sans-serif", letterSpacing: '-0.01em' }}>
          {pet.postType === 'adoption'
            ? 'Mascota en adopción'
            : pet.postType === 'lost'
              ? 'Mascota perdida'
              : pet.postType === 'found'
                ? 'Mascota encontrada'
                : 'Mascota'}
        </h1>
        <div className="flex flex-col md:flex-row gap-6 md:items-center">
          {/* Imágenes */}
          <div className="md:w-1/2 relative">
            {hasImages ? (
              <>
                <img
                  src={
                    pet.imagenes[currentImage].filepath && /^https?:\/\//i.test(pet.imagenes[currentImage].filepath)
                      ? pet.imagenes[currentImage].filepath
                      : `http://localhost:8090${(pet.imagenes[currentImage].filepath || '').startsWith('/') ? '' : '/'}${pet.imagenes[currentImage].filepath || ''}`
                  }
                  alt={`Mascota ${currentImage + 1}`}
                  className="w-full rounded-lg object-cover h-72 max-h-[420px] cursor-pointer"
                  onClick={() => setShowFullImage(true)}
                  title="Ver imagen completa"
                />
                {pet.imagenes.length > 1 && (
                  <>
                    <button
                      onClick={handlePrev}
                      className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-white bg-opacity-70 hover:bg-opacity-100 p-1 rounded-full"
                    >
                      ◀
                    </button>
                    <button
                      onClick={handleNext}
                      className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-white bg-opacity-70 hover:bg-opacity-100 p-1 rounded-full"
                    >
                      ▶
                    </button>
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-2">
                      {pet.imagenes.map((_, i) => (
                        <span
                          key={i}
                          className={`w-2 h-2 rounded-full ${i === currentImage ? 'bg-blue-600' : 'bg-gray-300'}`}
                        ></span>
                      ))}
                    </div>
                  </>
                )}
                {/* Modal de imagen completa */}
                {showFullImage && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80" onClick={() => setShowFullImage(false)}>
                    <img
                      src={
                        pet.imagenes[currentImage].filepath && /^https?:\/\//i.test(pet.imagenes[currentImage].filepath)
                          ? pet.imagenes[currentImage].filepath
                          : `http://localhost:8090${(pet.imagenes[currentImage].filepath || '').startsWith('/') ? '' : '/'}${pet.imagenes[currentImage].filepath || ''}`
                      }
                      alt={`Mascota ${currentImage + 1}`}
                      className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-2xl border-4 border-white"
                      style={{ objectFit: 'contain' }}
                    />
                    <button
                      className="absolute top-6 right-8 text-white text-3xl font-bold bg-black bg-opacity-40 rounded-full px-3 py-1 hover:bg-opacity-70 transition"
                      onClick={e => { e.stopPropagation(); setShowFullImage(false); }}
                      title="Cerrar"
                    >
                      ×
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-72 bg-gray-100 rounded-lg flex items-center justify-center">
                <img
                  src="/no-image.png"
                  alt="Sin imagen"
                  className="max-h-full max-w-full object-contain p-4 opacity-70"
                />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="md:w-1/2 space-y-4">
            <h2 className="text-3xl font-bold">{pet.name || 'Sin nombre'}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-4">
                {leftDetails.map((d, i) => (
                  <DetailItem key={`l-${i}`} label={d.label} value={d.value} />
                ))}
              </div>
              <div className="space-y-4">
                {rightDetails.map((d, i) => (
                  <DetailItem key={`r-${i}`} label={d.label} value={d.value} />
                ))}
              </div>
            </div>

            <p className="text-xs text-gray-500 font-semibold" style={{ color: '#6B7280' }}>Descripción</p>
            <p className="whitespace-pre-line">{pet.description}</p>
            {!user?.suspended && (
              <div className="pt-8 pb-4 flex items-center gap-2 flex-wrap relative">
                {/* Botón de reportar, ahora arriba a la derecha y más pequeño */}
                <button
                  type="button"
                  onClick={() => setReportOpen(true)}
                  className="absolute top-0 right-0 border border-red-200 text-red-500 bg-white hover:bg-red-50 hover:border-red-400 transition text-xs px-2.5 py-1.5 rounded flex items-center gap-1 shadow-none font-medium"
                  style={{ zIndex: 10 }}
                  title="Reportar publicación"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-1.414-1.414A9 9 0 105.636 18.364l1.414 1.414A9 9 0 1018.364 5.636z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" /></svg>
                  Reportar
                </button>

                {/* Botón de chat y errores */}
                <div className="flex items-center gap-2 flex-wrap w-full">
                  {canStartChat && (
                    <button
                      type="button"
                      data-testid="start-chat-button"
                      onClick={handleStartChat}
                      disabled={startingChat}
                      className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 disabled:opacity-60 text-white text-lg px-7 py-3 rounded-xl shadow-lg font-bold flex items-center gap-2 transition-all duration-200"
                      title={
                        pet.postType === 'adoption'
                          ? '¡Habla con el responsable de la adopción!'
                          : pet.postType === 'lost'
                            ? '¡Habla con el dueño de la mascota!'
                            : pet.postType === 'found'
                              ? '¡Habla con quien encontró la mascota!'
                              : 'Iniciar chat'
                      }
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.8l-4 1 1-3.5A7.96 7.96 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                      {startingChat
                        ? 'Creando chat…'
                        : pet.postType === 'adoption'
                          ? '¡Enviar mensaje!'
                          : pet.postType === 'lost'
                            ? '¡Hablar con el dueño!'
                            : pet.postType === 'found'
                              ? 'Enviar mensaje'
                              : 'Iniciar chat'}
                    </button>
                  )}

                  {startError && (
                    <span className="text-sm text-red-600">{startError}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        {pet.zone && (
          <div className="mt-6 relative z-0">
            <h3 className="text-2xl font-bold mb-1 text-black">Ubicación de la mascota en el mapa</h3>
            <p className="text-sm text-gray-500 mb-3">Ubicación aproximada</p>
            {mapLoading && !mapError && (
              <p className="text-base mb-2 inline-flex items-center gap-2 text-blue-700">
                <span className="inline-block w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                {barrioLoadingText}
              </p>
            )}
            {mapError && <p className="text-base text-red-600 mb-2">{mapError}</p>}
            <MiniLeafletMap
              barrioPoint={barrioPoint}
              userPos={userPos}
              height="380px"
              userLabel={<span className="text-lg font-semibold text-black">Tu Ubicación</span>}
              barrioLabel={
                pet.postType === 'lost'
                  ? <span className="text-lg font-semibold text-black">Zona de la mascota perdida</span>
                  : pet.postType === 'found'
                    ? <span className="text-lg font-semibold text-black">Zona de la mascota encontrada</span>
                    : pet.postType === 'adoption'
                      ? <span className="text-lg font-semibold text-black">Zona de la mascota en adopción</span>
                      : <span className="text-lg font-semibold text-black">Barrio</span>
              }
              className="z-0"
            />
          </div>
        )}
      </div>
      <ReportPostModal
        post={pet}
        ownerUserId={pet.userId || pet.ownerId || pet.id_user}
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        onSuccess={() => setReportOpen(false)}
      />
      {/* Carrusel de mascotas similares */}
      {pet.postId && (pet.postType === 'lost' || pet.postType === 'found') && (
        <div className="mt-10">
          <SimilarPetsCarousel postId={pet.postId} postType={pet.postType} petName={pet.name} />
        </div>
      )}

    </div>
  );
};

const DetailItem = ({ label, value }) => (
  <div className="min-h-[48px]">
    <p className="text-xs text-gray-500 font-semibold" style={{ color: '#6B7280' }}>{label}</p>
    <p className="capitalize leading-snug text-gray-900">{value}</p>
  </div>
);

// Util local para formato DD/MM/AAAA aceptando ISO o string simple
function formatDate(dateStr) {
  try {
    if (!dateStr) return '';
    const parts = dateStr.includes('T') ? new Date(dateStr) : new Date(dateStr);
    if (isNaN(parts.getTime())) return dateStr;
    const d = String(parts.getDate()).padStart(2, '0');
    const m = String(parts.getMonth() + 1).padStart(2, '0');
    const y = parts.getFullYear();
    return `${d}/${m}/${y}`;
  } catch {
    return dateStr;
  }
}

export default PetDetail;
