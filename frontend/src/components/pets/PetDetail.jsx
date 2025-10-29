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
        className="absolute top-2 left-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
      >
        ← Volver al listado
      </button>

      <div className="mt-12 p-6 bg-white rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row gap-6">
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
                  className="w-full rounded-lg object-cover h-72 max-h-[420px]"
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
                          className={`w-2 h-2 rounded-full ${i === currentImage ? 'bg-blue-600' : 'bg-gray-300'
                            }`}
                        ></span>
                      ))}
                    </div>
                  </>
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

            <p className="text-sm text-gray-500">Descripción</p>
            <p className="whitespace-pre-line">{pet.description}</p>
            {!user?.suspended && (
              <div className="pt-4 flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setReportOpen(true)}
                  className="bg-red-600 hover:bg-red-700 text-white text-sm px-5 py-2 rounded shadow"
                >
                  Reportar publicación
                </button>

                {canStartChat && (
                  <button
                    type="button"
                    onClick={handleStartChat}
                    disabled={startingChat}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm px-5 py-2 rounded shadow"
                  >
                    {startingChat ? 'Creando chat…' : 'Iniciar chat'}
                  </button>
                )}

                {startError && (
                  <span className="text-sm text-red-600">{startError}</span>
                )}
              </div>
            )}
          </div>
        </div>
        {pet.zone && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Mapa de la zona</h3>
            {mapLoading && !mapError && (
              <p className="text-sm mb-2 inline-flex items-center gap-2 text-blue-700">
                <span className="inline-block w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                {barrioLoadingText}
              </p>
            )}
            {mapError && <p className="text-sm text-red-600 mb-2">{mapError}</p>}
            <MiniLeafletMap
              barrioPoint={barrioPoint}
              userPos={userPos}
              height="380px"
              userLabel="Tu Ubicación"
              barrioLabel={
                pet.postType === 'lost'
                  ? 'Zona de la mascota perdida'
                  : pet.postType === 'found'
                    ? 'Zona de la mascota encontrada'
                    : pet.postType === 'adoption'
                      ? 'Zona de la mascota en adopción'
                      : 'Barrio'
              }
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
      {pet.postId && pet.postType && (
        <div className="mt-10">
          <SimilarPetsCarousel postId={pet.postId} postType={pet.postType} />
        </div>
      )}

    </div>
  );
};

const DetailItem = ({ label, value }) => (
  <div className="min-h-[48px]">
    <p className="text-sm text-gray-500">{label}</p>
    <p className="capitalize leading-snug">{value}</p>
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
