import apiSearch from './axiosConfigSearch';

export const getSimilarPets = async (id, type, species) => {
  try {
    const qs = `post_id=${encodeURIComponent(id)}&post_type=${encodeURIComponent(type)}` + (species ? `&species=${encodeURIComponent(species)}` : '');
    const res = await apiSearch.get(`/vectors/search?${qs}`);
    return { success: true, data: res.data };
  } catch (err) {
    console.error('SearchService.getSimilarPets error:', err?.response || err.message || err);
    return {
      success: false,
      message: 'Error al obtener publicaciones parecidas',
      error: err?.response?.data || err.message || String(err),
    };
  }
};