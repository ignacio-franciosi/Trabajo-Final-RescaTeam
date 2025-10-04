import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPost } from '../../services/PostService';
import { useAuth } from '../../context/AuthContext';

const PetForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const errorRef = useRef(null);

  const [formData, setFormData] = useState({
    // Campos del DTO de posts
    postType: 'adoption', // 'adoption' | 'lost' | 'found'
    postStatus: true,     // activo al crear
    name: '',
    species: 'perro',
    age: '',
    breed: '',
    color: '',
    size: 'mediano',
    sex: 'macho',
    description: '',
    neutered: false,
    complete_vaccines: false, // lo mapeamos a completeVaccines
    date: new Date().toISOString().slice(0, 10),
    zone: '',
    healthStatus: '',
    collar: false,
    collarColor: '',
  });

  const [images, setImages] = useState([]);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Se elimina la lógica de teléfono según lo solicitado

  useEffect(() => {
    if ((generalError || Object.keys(errors).length > 0) && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [errors, generalError]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);

    if (selected.length > 3) {
      setGeneralError('Solo se pueden subir hasta 3 imágenes.');
      return;
    }

    const validFormats = ['image/jpeg', 'image/jpg', 'image/png'];
    const invalidFiles = selected.filter((file) => !validFormats.includes(file.type));

    if (invalidFiles.length > 0) {
      setGeneralError('Solo se permiten imágenes en formato .jpg o .png');
      return;
    }

    setGeneralError('');
    setImages(selected);
  };

  const validateFields = () => {
  const requiredFields = ['postType', 'species', 'age', 'size', 'sex', 'color', 'zone', 'description'];
    const newErrors = {};

    requiredFields.forEach((field) => {
      if (!formData[field] || formData[field].toString().trim() === '') {
        newErrors[field] = 'Este campo es obligatorio.';
      }
    });

    const ageValue = parseInt(formData.age);
    if (isNaN(ageValue) || ageValue < 0) {
      newErrors.age = 'La edad debe ser un número válido y no negativo.';
    }

    if (images.length === 0) {
      setGeneralError('Debes subir al menos una imagen.');
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');
    setSuccessMsg('');

    const fieldErrors = validateFields();
    if (Object.keys(fieldErrors).length > 0 || images.length === 0) {
      setErrors(fieldErrors);
      return;
    }

    const data = new FormData();
    const finalForm = {
      ...formData,
      name: formData.name?.trim() || 'Sin nombre',
      breed: formData.breed?.trim() || 'Mestizo',
    };

    Object.entries(finalForm).forEach(([key, value]) => {
      // mapear complete_vaccines -> completeVaccines para el backend
      if (key === 'complete_vaccines') {
        data.append('completeVaccines', value);
      } else {
        data.append(key, value);
      }
    });
    images.forEach((file) => {
      data.append('images', file);
    });

  const res = await createPost(data);
    if (res.success) {
      setSuccessMsg('¡Mascota publicada con éxito!');
      setTimeout(() => navigate('/mis-publicaciones'), 1500);
    } else {
      setGeneralError(res.message || 'Error al publicar la mascota.');
    }
  };

  const inputClass = (field) =>
    `w-full mt-1 px-4 py-2 border rounded-md ${errors[field] ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
    }`;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md mt-10">
      <h2 className="text-2xl font-bold mb-6 text-center">Publicar Mascota</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Tipo de publicación</label>
            <div className="flex items-center gap-4 mt-1">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="postType"
                  value="adoption"
                  checked={formData.postType === 'adoption'}
                  onChange={handleChange}
                />
                Adopción
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="postType"
                  value="lost"
                  checked={formData.postType === 'lost'}
                  onChange={handleChange}
                />
                Perdido
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="postType"
                  value="found"
                  checked={formData.postType === 'found'}
                  onChange={handleChange}
                />
                Encontrado
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre (opcional)</label>
            <input name="name" value={formData.name} onChange={handleChange} className={inputClass('name')} placeholder="Ej: Lola" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Especie</label>
            <select name="species" value={formData.species} onChange={handleChange} className={inputClass('species')}>
              <option value="perro">Perro</option>
              <option value="gato">Gato</option>
            </select>
            {errors.species && <p className="text-red-500 text-sm">{errors.species}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Edad</label>
            <input type="number" name="age" value={formData.age} onChange={handleChange} className={inputClass('age')} />
            {errors.age && <p className="text-red-500 text-sm">{errors.age}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Tamaño</label>
            <select name="size" value={formData.size} onChange={handleChange} className={inputClass('size')}>
              <option value="pequeño">Pequeño</option>
              <option value="mediano">Mediano</option>
              <option value="grande">Grande</option>
            </select>
            {errors.size && <p className="text-red-500 text-sm">{errors.size}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Raza</label>
            <input name="breed" value={formData.breed} onChange={handleChange} className={inputClass('breed')} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Sexo</label>
            <select name="sex" value={formData.sex} onChange={handleChange} className={inputClass('sex')}>
              <option value="macho">Macho</option>
              <option value="hembra">Hembra</option>
            </select>
            {errors.sex && <p className="text-red-500 text-sm">{errors.sex}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Color</label>
            <input name="color" value={formData.color} onChange={handleChange} className={inputClass('color')} />
            {errors.color && <p className="text-red-500 text-sm">{errors.color}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Zona</label>
            <input name="zone" value={formData.zone} onChange={handleChange} className={inputClass('zone')} />
            {errors.zone && <p className="text-red-500 text-sm">{errors.zone}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Estado de salud</label>
            <input name="healthStatus" value={formData.healthStatus} onChange={handleChange} className={inputClass('healthStatus')} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Collar</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="collar" checked={formData.collar} onChange={handleChange} />
                Tiene collar
              </label>
              <input
                name="collarColor"
                value={formData.collarColor}
                onChange={handleChange}
                placeholder="Color del collar (opcional)"
                className={inputClass('collarColor')}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Descripción</label>
          <textarea name="description" value={formData.description} onChange={handleChange} rows="3" className={inputClass('description')} />
          {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
        </div>

        <div className="flex items-center space-x-6">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="neutered" checked={formData.neutered} onChange={handleChange} />
            Castrado
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="complete_vaccines" checked={formData.complete_vaccines} onChange={handleChange} />
            Vacunas completas
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Fotos (.jpg / .png, máx. 3)</label>
          <input type="file" accept=".jpg,.jpeg,.png" multiple onChange={handleFileChange} className="mt-1" />
        </div>

        {images.length > 0 && (
          <div className="flex gap-4 mt-2">
            {images.map((img, i) => (
              <img key={i} src={URL.createObjectURL(img)} alt="preview" className="w-20 h-20 object-cover rounded" />
            ))}
          </div>
        )}

        {generalError && (
          <p ref={errorRef} className="text-red-500 text-sm font-semibold border-l-4 border-red-400 pl-2">
            ⚠ {generalError}
          </p>
        )}
        {successMsg && <p className="text-green-600 text-sm font-semibold">{successMsg}</p>}

        <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition">
          Publicar
        </button>
      </form>
    </div>
  );
};

export default PetForm;
