import apiAdoption from './axiosConfigPost';

export const createPost = async (formData) => {
  try {
    const token = localStorage.getItem('token');
    const res = await apiAdoption.post('/post', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    });
    return { success: true, data: res.data };
    } catch {
    return { 
      success: false,
      message: error.response?.data?.error || 'Error al publicar la mascota',
    };
  }
};

export const autocompletePostFromImage = async (imageFile) => {
  try {
    const form = new FormData();
    // Backend acepta 'image' o 'file'; usamos 'image'
    form.append('image', imageFile);
    const res = await apiAdoption.post('/post/autocomplete', form, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return { success: true, data: res.data };
    } catch {
    return { 
      success: false,
      message: error.response?.data?.error || 'No se pudo autocompletar con la imagen',
    };
  }
};

export const getPostById = async (id) => {
  try {
    const res = await apiAdoption.get(`/post/${id}`);
    return { success: true, data: res.data };
    } catch {
    return { 
      success: false,
      message: 'Error al obtener publicación',
    };
  }
};

export const getAllPosts = async (type) => {
  try {
    const res = type
      ? await apiAdoption.get(`/post?type=${encodeURIComponent(type)}`)
      : await apiAdoption.get('/post');
    return { success: true, data: res.data };
    } catch {
    return { 
      success: false,
      message: error.response?.data?.error || 'Error al obtener publicaciones',
    };
  }
};

export const getImagesByPostId = async (postId) => {
  try {
    const res = await apiAdoption.get(`/post/images/${postId}`);
    return { success: true, data: res.data };
    } catch {
    return { 
      success: false,
      message: 'Error al obtener imágenes',
    };
  }
};

export const getPostsByUserId = async (userId) => {
  try {
    const token = localStorage.getItem('token');
    const res = await apiAdoption.get(`/post/user/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.data.message === 'Aún no hay publicaciones.') {
      return { success: true, data: [] };
    }

    return { success: true, data: res.data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.error || 'Error al obtener tus publicaciones.',
    };
  }
};

export const getAllPostsByUserId = async (userId) => {
  try {
    const token = localStorage.getItem('token');
    const res = await apiAdoption.get(`/post/user/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    // Manejo seguro de estructura de datos
    const data = Array.isArray(res.data) ? res.data : [];

    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      message:
        err.response?.data?.error || 'Error al obtener publicaciones del usuario.',
    };
  }
};

export const updatePost = async (id, data) => {
  try {
    const res = await apiAdoption.put(`/post/${id}`, data);
    return { success: true, data: res.data };
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.error || 'Error al actualizar la publicación'
    };
  }
};

export const uploadImage = async (postId, imageFile) => {
  try {
    const formData = new FormData();
    formData.append('postId', postId);
    formData.append('image', imageFile);

    const res = await apiAdoption.post('/post/images/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
        // Authorization ya se incluye automáticamente desde axiosConfigAdoption
      }
    });

    return { success: true, data: res.data };
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.error || 'Error al subir la imagen'
    };
  }
};

export const deleteImageById = async (imageId) => {
  try {
    const res = await apiAdoption.delete(`/post/images/${imageId}`);
    return { success: true, data: res.data };
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.error || 'Error al eliminar la imagen'
    };
  }
};

export const deletePost = async (id) => {
  try {
    const res = await apiAdoption.delete(`/post/${id}`);
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, message: err.response?.data?.error || 'Error al eliminar publicación' };
  }
};

export const deleteAllImagesByPostId = async (postId) => {
  try {
    const res = await apiAdoption.delete(`/post/images/deleteall/${postId}`);
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, message: err.response?.data?.error || 'Error al eliminar imágenes' };
  }
};

export const markAsResolved = async (postId) => {
  try {
    const res = await apiAdoption.put(`/post/resolved/${postId}`);
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, message: err.response?.data?.error || 'Error al marcar como adoptada' };
  }
};

export const getFilteredPosts = async (filters) => {
  try {
    const queryParams = new URLSearchParams();

    // postType: solo si fue provisto, sino traer todos los tipos
    const postType = filters.postType || filters.tipo;
    if (postType) queryParams.append('postType', postType);

    if (filters.especie || filters.species) queryParams.append('species', filters.especie || filters.species);
    if (filters.edad || filters.age) queryParams.append('age', filters.edad || filters.age);
    if (filters.tamaño || filters.size) queryParams.append('size', filters.tamaño || filters.size);
    if (filters.sexo || filters.sex) queryParams.append('sex', filters.sexo || filters.sex);
    if (filters.castrado || filters.neutered) queryParams.append('neutered', filters.castrado || filters.neutered);
    if (filters.vacunas || filters.completeVaccines) queryParams.append('completeVaccines', filters.vacunas || filters.completeVaccines);
  if (filters.zona || filters.zone) queryParams.append('zone', (filters.zona || filters.zone));
    // Filtros adicionales soportados por el backend
    if (filters.healthStatus || filters.estadoSalud) queryParams.append('healthStatus', filters.healthStatus || filters.estadoSalud);
    if (filters.collarColor || filters.colorCollar) queryParams.append('collarColor', filters.collarColor || filters.colorCollar);
    if (filters.breed || filters.raza) queryParams.append('breed', filters.breed || filters.raza);

    const res = await apiAdoption.get(`/post/filter?${queryParams.toString()}`);
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, message: err.response?.data?.error || 'Error al filtrar mascotas' };
  }
};
