import apiSearch from './axiosConfigSearch';

export const getSimilarPets = async (id, type, species) => {
  try {
    const res = await apiSearch.get(`/vectors/search?post_id=${id}&post_type=${type}&species=${species}`);
    return { success: true, data: res.data };
    } catch {
    return { 
      success: false,
      message: 'Error al obtener publicaciones parecidas',
    };
  }
};