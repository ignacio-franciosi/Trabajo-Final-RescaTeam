import apiAdoption from './axiosConfigAdoption';

export const createAdoptionPost = async (formData) => {
  try {
    const token = localStorage.getItem('token');
    const res = await apiAdoption.post('/adoptionPost', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    });
    return { success: true, data: res.data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.error || 'Error al publicar la mascota',
    };
  }
};

export const getAdoptionPostById = async (id) => {
  try {
    const res = await apiAdoption.get(`/adoptionPost/${id}`);
    return { success: true, data: res.data };
  } catch (error) {
    return {
      success: false,
      message: 'Error al obtener publicación',
    };
  }
};

export const getAllAdoptionPosts = async () => {
  try {
    const res = await apiAdoption.get('/adoptionPost');
    return { success: true, data: res.data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.error || 'Error al obtener publicaciones',
    };
  }
};

export const getImagesByAdoptionPostId = async (postId) => {
  try {
    const res = await apiAdoption.get(`/adoptionPost/images/${postId}`);
    return { success: true, data: res.data };
  } catch (error) {
    return {
      success: false,
      message: 'Error al obtener imágenes',
    };
  }
};

export const getAdoptionPostsByUserId = async (userId) => {
  try {
    const token = localStorage.getItem('token');
    const res = await apiAdoption.get(`/adoptionPost/user/${userId}`, {
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

export const getAllAdoptionPostsByUserId = async (userId) => {
  try {
    const res = await apiAdoption.get(`/adoptionPost/user/${userId}`);
    
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

export const updateAdoptionPost = async (id, data) => {
  try {
    const res = await apiAdoption.put(`/adoptionPost/${id}`, data);
    return { success: true, data: res.data };
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.error || 'Error al actualizar la publicación'
    };
  }
};

export const uploadAdoptionImage = async (postId, imageFile) => {
  try {
    const formData = new FormData();
    formData.append('adoption_post_id', postId);
    formData.append('image', imageFile);

    const res = await apiAdoption.post('/adoptionPost/images/upload', formData, {
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
    const res = await apiAdoption.delete(`/adoptionPost/images/${imageId}`);
    return { success: true, data: res.data };
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.error || 'Error al eliminar la imagen'
    };
  }
};

export const deleteAdoptionPost = async (id) => {
  try {
    const res = await apiAdoption.delete(`/adoptionPost/${id}`);
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, message: err.response?.data?.error || 'Error al eliminar publicación' };
  }
};

export const deleteAllImagesByPostId = async (postId) => {
  try {
    const res = await apiAdoption.delete(`/adoptionPost/images/deleteall/${postId}`);
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, message: err.response?.data?.error || 'Error al eliminar imágenes' };
  }
};

export const markAsAdopted = async (postId) => {
  try {
    const res = await apiAdoption.put(`/adoptionPost/adopted/${postId}`);
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, message: err.response?.data?.error || 'Error al marcar como adoptada' };
  }
};

export const getFilteredAdoptionPosts = async (filters) => {
  try {
    const queryParams = new URLSearchParams();

    if (filters.especie) queryParams.append('species', filters.especie);
    if (filters.edad) queryParams.append('age', filters.edad);
    if (filters.tamaño) queryParams.append('size', filters.tamaño);
    if (filters.sexo) queryParams.append('sex', filters.sexo);
    if (filters.castrado) queryParams.append('neutered', filters.castrado);
    if (filters.vacunas) queryParams.append('complete_vaccines', filters.vacunas);
    if (filters.zona) queryParams.append('zone', filters.zona.replace(/\s/g, '%'));

    const res = await apiAdoption.get(`/adoptionPost/filter?${queryParams.toString()}`);
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, message: err.response?.data?.error || 'Error al filtrar mascotas' };
  }
};
