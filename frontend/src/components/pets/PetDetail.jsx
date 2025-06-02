import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PetDetail = ({ pet }) => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [currentImage, setCurrentImage] = useState(0);
  const [phone, setPhone] = useState('');
  const hasImages = pet.imagenes && pet.imagenes.length > 0;

  const handleVolver = () => {
    navigate('/#pets-list');
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

  const handleContactar = () => {
    localStorage.setItem('redirectAfterLogin', `/mascota/${pet.id_adoption_post}`);
    navigate('/register');
  };

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
                  src={`http://localhost:8090${pet.imagenes[currentImage].file_path}`}
                  alt={`Mascota ${currentImage + 1}`}
                  className="w-full rounded-lg object-cover h-64"
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
                          className={`w-2 h-2 rounded-full ${
                            i === currentImage ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                        ></span>
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <img
                src="/no-image.png"
                alt="Sin imagen"
                className="w-full rounded-lg object-cover h-64"
              />
            )}
          </div>

          {/* Info */}
          <div className="md:w-1/2 space-y-4">
            <h2 className="text-3xl font-bold">{pet.name || 'Sin nombre'}</h2>
            <div className="grid grid-cols-2 gap-4">
              <DetailItem label="Especie" value={pet.species} />
              <DetailItem label="Edad" value={`${pet.age} años`} />
              <DetailItem label="Tamaño" value={pet.size} />
              <DetailItem label="Raza" value={pet.breed} />
              <DetailItem label="Sexo" value={pet.sex} />
              <DetailItem label="Color" value={pet.color} />
              <DetailItem label="Castrado" value={pet.neutered ? 'Sí' : 'No'} />
              <DetailItem label="Vacunas" value={pet.completeVaccines ? 'Completas' : 'Incompletas'} />
            </div>
            <DetailItem label="Zona" value={pet.zone} />

            <div>
              <p className="text-sm text-gray-500">Teléfono de contacto</p>
              {user? (
                <p className="capitalize">
                  {pet.phone?.trim()
                    ? pet.phone
                    : 'No disponible'}
                </p>
              ) : (
                <button
                  onClick={handleContactar}
                  className="mt-1 px-4 py-2 bg-rose-600 text-white rounded hover:bg-blue-700"
                >
                  Contactar
                </button>
              )}
            </div>

            <DetailItem label="Descripción" value={pet.description} />
          </div>
        </div>
      </div>
    </div>
  );
};

const DetailItem = ({ label, value }) => (
  <div>
    <p className="text-sm text-gray-500">{label}</p>
    <p className="capitalize">{value}</p>
  </div>
);

export default PetDetail;
