import api from './axiosConfig';

export const getUserById = async (id) => {
  try {
    const res = await api.get(`/user/${id}`);
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || 'Error al obtener usuario' };
  }
};

export const updateUser = async (id, updatedData) => {
  try {
    const res = await api.patch(`/user/${id}`, updatedData);
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || 'Error al actualizar usuario' };
  }
};

export const deleteUser = async (id) => {
  try {
    await api.delete(`/user/${id}`);
    return { success: true };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || 'Error al eliminar usuario' };
  }
};

// opcional: para validación en formularios
export const getUserByEmail = async (email) => {
  try {
    const res = await api.get(`/user/email/${email}`);
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, message: 'Email no encontrado' };
  }
};
