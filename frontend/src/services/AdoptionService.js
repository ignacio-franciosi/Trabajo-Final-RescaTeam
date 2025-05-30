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
