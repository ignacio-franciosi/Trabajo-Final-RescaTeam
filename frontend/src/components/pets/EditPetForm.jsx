import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getAdoptionPostById,
  getImagesByAdoptionPostId,
  updateAdoptionPost,
  uploadAdoptionImage,
  deleteImageById
} from '../../services/AdoptionService';

const EditPetForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const errorRef = useRef(null);

  const [formData, setFormData] = useState(null);
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchPost = async () => {
      const res = await getAdoptionPostById(id);
      const imgRes = await getImagesByAdoptionPostId(id);
      setExistingImages(Array.isArray(imgRes.data) ? imgRes.data : []);
      if (res.success) {
        setFormData({
          ...res.data,
          age: String(res.data.age || ''),
        });
        setExistingImages(imgRes.success ? imgRes.data : []);
      } else {
        setGeneralError(res.message);
      }
    };
    fetchPost();
  }, [id]);

  useEffect(() => {
    if ((generalError || Object.keys(errors).length > 0) && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [errors, generalError]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Limpiar error individual
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleNewImages = (e) => {
    const selected = Array.from(e.target.files);
    const totalImages = existingImages.length + selected.length;

    if (totalImages > 3) {
      setGeneralError('Solo se permiten hasta 3 imágenes en total.');
      return;
    }

    const valid = selected.filter(file => ['image/jpeg', 'image/png', 'image/jpg'].includes(file.type));
    if (valid.length !== selected.length) {
      setGeneralError('Solo se permiten imágenes .jpg o .png');
      return;
    }

    setGeneralError('');
    setNewImages(valid);
  };

  const handleDeleteImage = async (imageId) => {
    if (existingImages.length <= 1) {
      setGeneralError('Debe haber al menos una imagen en la publicación.');
      return;
    }

    const res = await deleteImageById(imageId);
    if (res.success) {
      setExistingImages(prev => prev.filter(img => img.image_id !== imageId));
    } else {
      setGeneralError(res.message);
    }
  };

  const validateFields = () => {
    const requiredFields = ['species', 'age', 'size', 'sex', 'color', 'zone', 'description'];
    const newErrors = {};

    requiredFields.forEach(field => {
      if (!formData[field] || formData[field].toString().trim() === '') {
        newErrors[field] = 'Este campo es obligatorio.';
      }
    });

    const ageValue = parseInt(formData.age, 10);
    if (isNaN(ageValue) || ageValue < 0) {
      newErrors.age = 'La edad debe ser un número válido y no negativo.';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');
    setSuccess('');
    const fieldErrors = validateFields();

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    const preparedData = {
      ...formData,
      name: formData.name?.trim() || 'Sin nombre',
      breed: formData.breed?.trim() || 'Mestizo',
      age: parseInt(formData.age, 10),
    };

    const res = await updateAdoptionPost(id, preparedData);
    if (!res.success) {
      setGeneralError(res.message);
      return;
    }

    for (let img of newImages) {
      await uploadAdoptionImage(id, img);
    }

    setSuccess('¡Publicación actualizada con éxito!');
    setTimeout(() => navigate('/mis-publicaciones'), 1500);
  };

  if (!formData) return <p className="text-center">Cargando publicación...</p>;

  const inputClass = (field) =>
    `w-full mt-1 px-4 py-2 border rounded-md ${
      errors[field] ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
    }`;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md mt-10">
      <h2 className="text-2xl font-bold mb-6 text-center">Editar Mascota</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600">Nombre (opcional)</label>
            <input name="name" value={formData.name} onChange={handleChange} className={inputClass('name')} />
          </div>

          <div>
            <label className="text-sm text-gray-600">Especie</label>
            <select name="species" value={formData.species} onChange={handleChange} className={inputClass('species')}>
              <option value="perro">Perro</option>
              <option value="gato">Gato</option>
            </select>
            {errors.species && <p className="text-red-500 text-sm">{errors.species}</p>}
          </div>

          <div>
            <label className="text-sm text-gray-600">Edad</label>
            <input type="number" name="age" value={formData.age} onChange={handleChange} className={inputClass('age')} />
            {errors.age && <p className="text-red-500 text-sm">{errors.age}</p>}
          </div>

          <div>
            <label className="text-sm text-gray-600">Tamaño</label>
            <select name="size" value={formData.size} onChange={handleChange} className={inputClass('size')}>
              <option value="pequeño">Pequeño</option>
              <option value="mediano">Mediano</option>
              <option value="grande">Grande</option>
            </select>
            {errors.size && <p className="text-red-500 text-sm">{errors.size}</p>}
          </div>

          <div>
            <label className="text-sm text-gray-600">Raza (opcional)</label>
            <input name="breed" value={formData.breed} onChange={handleChange} className={inputClass('breed')} />
          </div>

          <div>
            <label className="text-sm text-gray-600">Color</label>
            <input name="color" value={formData.color} onChange={handleChange} className={inputClass('color')} />
            {errors.color && <p className="text-red-500 text-sm">{errors.color}</p>}
          </div>

          <div>
            <label className="text-sm text-gray-600">Sexo</label>
            <select name="sex" value={formData.sex} onChange={handleChange} className={inputClass('sex')}>
              <option value="macho">Macho</option>
              <option value="hembra">Hembra</option>
            </select>
            {errors.sex && <p className="text-red-500 text-sm">{errors.sex}</p>}
          </div>

          <div>
            <label className="text-sm text-gray-600">Zona</label>
            <input name="zone" value={formData.zone} onChange={handleChange} className={inputClass('zone')} />
            {errors.zone && <p className="text-red-500 text-sm">{errors.zone}</p>}
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-600">Descripción</label>
          <textarea name="description" value={formData.description} onChange={handleChange} className={inputClass('description')} rows="3" />
          {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
        </div>

        <div className="flex gap-6 items-center">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="neutered" checked={formData.neutered} onChange={handleChange} />
            Castrado
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="completeVaccines" checked={formData.completeVaccines} onChange={handleChange} />
            Vacunas completas
          </label>
        </div>

        <div className="flex gap-4 flex-wrap">
          {Array.isArray(existingImages) && existingImages.map(img => (
            <div key={img.image_id} className="relative">
              <img src={`http://localhost:8090${img.file_path}`} alt="img" className="w-24 h-24 object-cover rounded" />
              <button
                type="button"
                onClick={() => handleDeleteImage(img.image_id)}
                className="absolute top-0 right-0 bg-red-500 text-white rounded-full px-1"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <input type="file" accept=".jpg,.jpeg,.png" multiple onChange={handleNewImages} />

        {newImages.length > 0 && (
          <div className="flex gap-4 mt-2">
            {newImages.map((img, i) => (
              <img key={i} src={URL.createObjectURL(img)} alt="preview" className="w-20 h-20 object-cover rounded" />
            ))}
          </div>
        )}

        {generalError && (
          <p ref={errorRef} className="text-red-500 text-sm font-semibold border-l-4 border-red-400 pl-2">
            ⚠ {generalError}
          </p>
        )}
        {success && <p className="text-green-600 text-sm font-semibold">{success}</p>}

        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          Guardar cambios
        </button>
      </form>
    </div>
  );
};

export default EditPetForm;
