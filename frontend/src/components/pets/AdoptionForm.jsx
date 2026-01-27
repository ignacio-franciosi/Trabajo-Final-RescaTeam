import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPost, autocompletePostFromImage } from '../../services/PostService';
import ZoneSelect from './ZoneSelect';
import { useAuth } from '../../context/AuthContext';
import SuspendedNotice from '../common/SuspendedNotice';

// Formulario exclusivo para publicaciones de adopción
const AdoptionForm = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const errorRef = useRef(null);

    const [formData, setFormData] = useState({
        postType: 'adoption',
        postStatus: false, // siempre false al crear
        name: '',
        species: 'perro',
        age: '',
        breed: '',
        color: '',
        size: 'mediano',
        sex: 'macho',
        description: '',
        neutered: false,
        complete_vaccines: false, // map a completeVaccines
        date: new Date().toISOString().slice(0, 10),
        zone: '',
    });

    const [images, setImages] = useState([]);
    const [aiImage, setAiImage] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [generalError, setGeneralError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        if ((generalError || Object.keys(errors).length > 0) && errorRef.current) {
            errorRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [errors, generalError]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        if (errors[name]) {
            setErrors(prev => { const c = { ...prev }; delete c[name]; return c; });
        }
    };

    const handleFileChange = (e) => {
        const selected = Array.from(e.target.files);
        if (selected.length > 3) { setGeneralError('Solo se pueden subir hasta 3 imágenes.'); return; }
        const validFormats = ['image/jpeg', 'image/jpg', 'image/png'];
        if (selected.some(f => !validFormats.includes(f.type))) { setGeneralError('Solo .jpg o .png'); return; }
        setGeneralError('');
        setImages(selected);
    };

    const handleAiDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files && e.dataTransfer.files[0];
        if (file) handleAiSelect({ target: { files: [file] } });
    };

    const handleAiSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const validFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validFormats.includes(file.type)) { setGeneralError('La imagen debe ser .jpg, .png o .webp'); return; }
        setAiImage(file);
        setAiLoading(true);
        setGeneralError('');
        const res = await autocompletePostFromImage(file);
        setAiLoading(false);
        if (!res.success) {
            setGeneralError(res.message);
            return;
        }
        const d = res.data || {};
        // Mapear solo si existe cada campo; no sobreescribir si el usuario ya puso uno manualmente
        setFormData(prev => ({
            ...prev,
            name: d.name ?? prev.name,
            species: d.species ? d.species.toLowerCase() : prev.species,
            age: d.age ?? prev.age,
            breed: d.breed ?? prev.breed,
            color: d.color ?? prev.color,
            size: d.size ? d.size.toLowerCase() : prev.size,
            sex: d.sex ? d.sex.toLowerCase() : prev.sex,
            description: d.description ?? prev.description,
            neutered: typeof d.neutered === 'boolean' ? d.neutered : prev.neutered,
            complete_vaccines: typeof d.completeVaccines === 'boolean' ? d.completeVaccines : prev.complete_vaccines,
            date: d.date ?? prev.date,
            zone: d.zone ?? prev.zone,
            // healthStatus y collar/collarColor no aplican a adopción
        }));
    };

    const validate = () => {
        // Campos obligatorios según requerimiento (breed NO obligatorio)
        const req = ['species', 'age', 'color', 'size', 'sex', 'zone'];
        const newErr = {};
        req.forEach(f => { if (!formData[f] || formData[f].toString().trim() === '') newErr[f] = 'Obligatorio'; });
        const ageValue = parseInt(formData.age, 10); if (isNaN(ageValue) || ageValue < 0) newErr.age = 'Edad inválida';
        // Imagen obligatoria
        if (images.length === 0) {
            setGeneralError('Debes subir al menos una imagen.');
        }
        return newErr;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setGeneralError(''); setSuccessMsg('');
        const fieldErrors = validate();
        if (Object.keys(fieldErrors).length > 0 || images.length === 0) { setErrors(fieldErrors); return; }

        const data = new FormData();
        const finalForm = {
            ...formData,
            // Aseguramos que age se mande como string incluso si es 0
            age: formData.age === '' ? '' : String(parseInt(formData.age, 10)),
            name: formData.name?.trim() || 'Mascota sin nombre',
            breed: formData.breed?.trim() || 'mestizo',
        };

        Object.entries(finalForm).forEach(([k, v]) => {
            if (k === 'complete_vaccines') data.append('completeVaccines', v);
            else if (v !== undefined && v !== null) data.append(k, v);
        });
        images.forEach(img => data.append('images', img));

        const res = await createPost(data);
        if (res.success) {
            setSuccessMsg('✅ Publicación creada correctamente. Redirigiendo...');
            setTimeout(() => navigate('/mis-publicaciones?type=adoption'), 1600);
        } else {
            setGeneralError(res.message || 'Error al crear publicación');
        }
    };

    const inputClass = (f) => `w-full mt-1 px-3 py-2 border rounded-md text-sm ${errors[f] ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`;

    if (user?.suspended) {
        return <SuspendedNotice />;
    }
    return (
        <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow mt-8 border-t-4 border-emerald-500">
            <h2 className="text-2xl font-bold mb-2 text-center text-emerald-700">Publicar Mascota en Adopción</h2>
            <p className="text-center text-gray-600 mb-6 text-sm">Completá los datos para ayudar a que encuentre un hogar.</p>
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* AI Autocomplete */}
                <div className="p-4 border rounded-lg bg-emerald-50 border-emerald-200">
                    <div className="flex items-center gap-3">
                        <div className="shrink-0 w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold">AI</div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-emerald-900">Autocompletar formulario con imagen</h3>
                            <p className="text-xs text-emerald-800">Seleccioná o arrastrá una imagen del post y completaremos los campos por vos. Se permite solo una imagen.</p>
                        </div>
                        <div className="flex flex-col gap-2">
                            <button
                                type="button"
                                className="hidden md:block px-3 py-2 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700"
                                onClick={() => document.getElementById('ai-file-input-adoption').click()}
                            >
                                Elegir imagen
                            </button>
                            <button
                                type="button"
                                className="md:hidden px-3 py-2 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700"
                                onClick={() => document.getElementById('ai-file-input-adoption').click()}
                            >
                                Galería
                            </button>
                            <button
                                type="button"
                                className="md:hidden px-3 py-2 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700"
                                onClick={() => document.getElementById('ai-camera-input-adoption').click()}
                            >
                                Cámara
                            </button>
                        </div>
                    </div>
                    <div
                        className={`mt-3 border-2 border-dashed rounded-md p-4 text-center text-sm ${aiLoading ? 'opacity-60' : ''}`}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={handleAiDrop}
                        onClick={() => document.getElementById('ai-file-input-adoption').click()}
                    >
                        {aiImage ? (
                            <div className="flex items-center gap-3 justify-center">
                                <img src={URL.createObjectURL(aiImage)} alt="ai-preview" className="w-16 h-16 object-cover rounded" />
                                <div className="text-left">
                                    <p className="text-gray-700 text-sm">{aiImage.name}</p>
                                    {aiLoading ? <p className="text-xs text-emerald-700">Analizando imagen...</p> : <p className="text-xs text-gray-500">Podés volver a elegir otra para reintentar.</p>}
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-600">Soltá acá la imagen del post o hacé click para seleccionarla</p>
                        )}
                    </div>
                    <input
                        id="ai-file-input-adoption"
                        hidden
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp"
                        onChange={handleAiSelect}
                    />
                    <input
                        id="ai-camera-input-adoption"
                        hidden
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleAiSelect}
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                        <label htmlFor="name" className="text-sm font-medium">Nombre (opcional)</label>
                        <input id="name" name="name" value={formData.name} onChange={handleChange} className={inputClass('name')} placeholder="Ej: Lola" />
                    </div>
                    <div>
                        <label htmlFor="species" className="text-sm font-medium">Especie <span className="text-red-500">*</span></label>
                        <select id="species" name="species" value={formData.species} onChange={handleChange} className={inputClass('species')}>
                            <option value="perro">Perro</option>
                            <option value="gato">Gato</option>
                        </select>
                        {errors.species && <p className="text-xs text-red-500">{errors.species}</p>}
                    </div>
                    <div>
                        <label htmlFor="age" className="text-sm font-medium">Edad <span className="text-red-500">*</span></label>
                        <input id="age" type="number" name="age" value={formData.age} onChange={handleChange} className={inputClass('age')} />
                        {errors.age && <p className="text-xs text-red-500">{errors.age}</p>}
                    </div>
                    <div>
                        <label htmlFor="breed" className="text-sm font-medium">Raza (opcional)</label>
                        <input id="breed" name="breed" value={formData.breed} onChange={handleChange} className={inputClass('breed')} placeholder="Mestizo" />
                    </div>
                    <div>
                        <label htmlFor="color" className="text-sm font-medium">Color <span className="text-red-500">*</span></label>
                        <input id="color" name="color" value={formData.color} onChange={handleChange} className={inputClass('color')} />
                        {errors.color && <p className="text-xs text-red-500">{errors.color}</p>}
                    </div>
                    <div>
                        <label htmlFor="size" className="text-sm font-medium">Tamaño <span className="text-red-500">*</span></label>
                        <select id="size" name="size" value={formData.size} onChange={handleChange} className={inputClass('size')}>
                            <option value="pequeño">Pequeño</option>
                            <option value="mediano">Mediano</option>
                            <option value="grande">Grande</option>
                        </select>
                        {errors.size && <p className="text-xs text-red-500">{errors.size}</p>}
                    </div>
                    <div>
                        <label htmlFor="sex" className="text-sm font-medium">Sexo <span className="text-red-500">*</span></label>
                        <select id="sex" name="sex" value={formData.sex} onChange={handleChange} className={inputClass('sex')}>
                            <option value="macho">Macho</option>
                            <option value="hembra">Hembra</option>
                        </select>
                        {errors.sex && <p className="text-xs text-red-500">{errors.sex}</p>}
                    </div>
                    <div>
                        <ZoneSelect
                            label="Barrio"
                            required
                            value={formData.zone}
                            onChange={(val) => {
                                setFormData(prev => ({ ...prev, zone: val }));
                                if (errors.zone) setErrors(prev => { const c = { ...prev }; delete c.zone; return c; });
                            }}
                        />
                        {errors.zone && <p className="text-xs text-red-500 mt-1">{errors.zone}</p>}
                    </div>
                </div>
                <div>
                    <label htmlFor="description" className="text-sm font-medium">Descripción (opcional)</label>
                    <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={3} className={inputClass('description')} />
                </div>
                <div className="flex flex-wrap gap-6 text-sm">
                    <label htmlFor="neutered" className="flex items-center gap-2">
                        <input id="neutered" type="checkbox" name="neutered" checked={formData.neutered} onChange={handleChange} />
                        Castrado
                    </label>
                    <label htmlFor="complete_vaccines" className="flex items-center gap-2">
                        <input id="complete_vaccines" type="checkbox" name="complete_vaccines" checked={formData.complete_vaccines} onChange={handleChange} />
                        Vacunas completas
                    </label>
                </div>
                <div>
                    <label className="text-sm font-medium">Agregá imágenes de tu mascota (obligatorio)</label>
                    <div className="mt-1 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 transition" onClick={() => document.getElementById('adoption-file-input').click()}>
                        <p className="text-xs text-gray-500">Click para seleccionar o arrastrar archivos</p>
                        <p className="text-[10px] text-gray-400 mt-1">Hasta 3 imágenes</p>
                    </div>
                    <input id="adoption-file-input" hidden type="file" accept=".jpg,.jpeg,.png" multiple onChange={handleFileChange} />
                </div>
                {images.length > 0 && (
                    <div className="flex gap-3 mt-3 flex-wrap">
                        {images.map((img, i) => (
                            <div key={i} className="relative group">
                                <img src={URL.createObjectURL(img)} alt="preview" className="w-24 h-24 object-cover rounded shadow" />
                                <button type="button" onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-black/60 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition" aria-label="Eliminar imagen">×</button>
                            </div>
                        ))}
                    </div>
                )}
                {generalError && <p ref={errorRef} className="text-xs text-red-600 font-semibold">⚠ {generalError}</p>}
                {successMsg && <p className="text-sm text-green-600 font-semibold bg-green-50 border border-green-300 rounded px-3 py-2">{successMsg}</p>}
                <button type="submit" data-testid="submit-post" className="w-full bg-emerald-600 text-white py-2 rounded hover:bg-emerald-700 text-sm font-medium">Publicar</button>
            </form>
        </div>
    );
};

export default AdoptionForm;
