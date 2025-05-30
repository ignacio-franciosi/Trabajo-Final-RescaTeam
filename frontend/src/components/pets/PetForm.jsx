import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createAdoptionPost } from '../../services/AdoptionService';

const PetForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    species: 'perro',
    age: '',
    size: 'mediano',
    breed: '',
    sex: 'macho',
    color: '',
    description: '',
    neutered: false,
    complete_vaccines: false,
    zone: '',
    phone: '',
    adoption_status: false,
    date: new Date().toISOString().slice(0, 10)
  });

  const [images, setImages] = useState([]);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files).slice(0, 3);
    const validFormats = ['image/jpeg', 'image/jpg', 'image/png'];
    const invalidFiles = selected.filter((file) => !validFormats.includes(file.type));

    if (invalidFiles.length > 0) {
      setError('Solo se permiten imágenes en formato .jpg o .png');
      setImages([]);
      return;
    }

    setError('');
    setImages(selected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (images.length === 0) {
      setError('Debes subir al menos una imagen.');
      return;
    }

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value);
    });
    images.forEach((file) => {
      data.append('images', file);
    });

    const res = await createAdoptionPost(data);
    if (res.success) {
      setSuccessMsg('¡Mascota publicada con éxito!');
      setTimeout(() => navigate('/mis-publicaciones'), 1500);
    } else {
      setError(res.message || 'Error al publicar la mascota.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md mt-10">
      <h2 className="text-2xl font-bold mb-6 text-center">Publicar Mascota</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre (opcional)</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md"
              placeholder="Ej: Lola"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Especie</label>
            <select
              name="species"
              value={formData.species}
              onChange={handleChange}
              className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md"
            >
              <option value="perro">Perro</option>
              <option value="gato">Gato</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Edad</label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Tamaño</label>
            <select
              name="size"
              value={formData.size}
              onChange={handleChange}
              className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md"
            >
              <option value="pequeño">Pequeño</option>
              <option value="mediano">Mediano</option>
              <option value="grande">Grande</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Raza</label>
            <input
              name="breed"
              value={formData.breed}
              onChange={handleChange}
              className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Sexo</label>
            <select
              name="sex"
              value={formData.sex}
              onChange={handleChange}
              className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md"
            >
              <option value="macho">Macho</option>
              <option value="hembra">Hembra</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Color</label>
            <input
              name="color"
              value={formData.color}
              onChange={handleChange}
              className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Zona</label>
            <input
              name="zone"
              value={formData.zone}
              onChange={handleChange}
              className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Teléfono de contacto</label>
            <input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Descripción</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md"
            required
          ></textarea>
        </div>

        <div className="flex items-center space-x-6">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="neutered"
              checked={formData.neutered}
              onChange={handleChange}
            />
            Castrado
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="complete_vaccines"
              checked={formData.complete_vaccines}
              onChange={handleChange}
            />
            Vacunas completas
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Fotos (.jpg / .png, máx. 3)</label>
          <input
            type="file"
            accept=".jpg,.jpeg,.png"
            multiple
            onChange={handleFileChange}
            className="mt-1"
          />
        </div>

        {images.length > 0 && (
          <div className="flex gap-4 mt-2">
            {images.map((img, i) => (
              <img key={i} src={URL.createObjectURL(img)} alt="preview" className="w-20 h-20 object-cover rounded" />
            ))}
          </div>
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {successMsg && <p className="text-green-600 text-sm">{successMsg}</p>}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
        >
          Publicar
        </button>
      </form>
    </div>
  );
};

export default PetForm;



/*
import React, { useState } from 'react';
import { createAdoptionPost } from '../../services/AdoptionService';
import { useNavigate } from 'react-router-dom';

const PetForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    species: 'perro',
    age: '',
    size: 'mediano',
    breed: '',
    sex: 'macho',
    color: '',
    description: '',
    neutered: false,
    complete_vaccines: false,
    zone: '',
    phone: '',
    adoption_status: false,
    date: new Date().toISOString().slice(0, 10)
  });

  const [images, setImages] = useState([]);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files).slice(0, 3);
    const validFormats = ['image/jpeg', 'image/jpg', 'image/png'];
    const invalidFiles = selected.filter((file) => !validFormats.includes(file.type));

    if (invalidFiles.length > 0) {
      setError('Solo se permiten imágenes en formato .jpg o .png');
      setImages([]);
      return;
    }

    setError('');
    setImages(selected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (images.length === 0) {
      setError('Debes subir al menos una imagen.');
      return;
    }

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value);
    });
    images.forEach((file) => {
      data.append('images', file);
    });

    const res = await createAdoptionPost(data);
    if (res.success) {
      setSuccessMsg('¡Mascota publicada con éxito!');
      setTimeout(() => navigate('/mis-publicaciones'), 1500);
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md mt-10">
      <h2 className="text-2xl font-bold mb-6 text-center">Publicar Mascota</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="name" placeholder="Nombre (opcional)" value={formData.name} onChange={handleChange} className="input" />
          <select name="species" value={formData.species} onChange={handleChange} className="input">
            <option value="perro">Perro</option>
            <option value="gato">Gato</option>
          </select>
          <input type="number" name="age" placeholder="Edad" value={formData.age} onChange={handleChange} required className="input" />
          <select name="size" value={formData.size} onChange={handleChange} className="input">
            <option value="pequeño">Pequeño</option>
            <option value="mediano">Mediano</option>
            <option value="grande">Grande</option>
          </select>
          <input name="breed" placeholder="Raza" value={formData.breed} onChange={handleChange} className="input" required />
          <select name="sex" value={formData.sex} onChange={handleChange} className="input">
            <option value="macho">Macho</option>
            <option value="hembra">Hembra</option>
          </select>
          <input name="color" placeholder="Color" value={formData.color} onChange={handleChange} className="input" required />
          <input name="zone" placeholder="Zona" value={formData.zone} onChange={handleChange} className="input" required />
          <input name="phone" placeholder="Teléfono" value={formData.phone} onChange={handleChange} className="input" required />
        </div>

        <textarea name="description" placeholder="Descripción" value={formData.description} onChange={handleChange} className="input w-full" rows="3" required />

        <div className="flex gap-6">
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
          <label className="block text-sm font-medium text-gray-700">Fotos (.jpg / .png, máx 3)</label>
          <input
            type="file"
            accept=".jpg,.jpeg,.png"
            multiple
            onChange={handleFileChange}
            className="mt-1"
          />
        </div>

        {images.length > 0 && (
          <div className="flex gap-4 mt-2">
            {images.map((img, i) => (
              <img key={i} src={URL.createObjectURL(img)} alt="preview" className="w-20 h-20 object-cover rounded" />
            ))}
          </div>
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {successMsg && <p className="text-green-600 text-sm">{successMsg}</p>}

        <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition">
          Publicar
        </button>
      </form>
    </div>
  );
};

export default PetForm;
*/