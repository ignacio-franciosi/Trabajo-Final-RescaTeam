import api from './axiosConfigUsers';

export const getUserById = async (id) => {
  try {
    const res = await api.get(`/user/${id}`);
    return { success: true, data: res.data };
  } catch {
    return { success: false, message: 'Usuario no encontrado' };
  }
};

export const getPhoneByUserId = async (id) => {
  try {
    const res = await api.get(`/user/phone/${id}`);
    return { success: true, data: res.data };
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.message || 'Error al obtener el teléfono público'
    };
  }
};

export const updateUser = async (id, data) => {
  try {
    const res = await api.patch(`/user/${id}`, data);
    return { success: true, data: res.data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.error || 'Error al actualizar el usuario',
    };
  }
};

export const deleteUser = async (id) => {
  try {
    const res = await api.delete(`/user/${id}`);
    return { success: true, message: res.data.message };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.error || "Error al eliminar el usuario",
    };
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

export const changePassword = async (userId, payload) => {
  try {
    await api.patch(`/user/${userId}/change-password`, payload);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.error || "Error al cambiar la contraseña"
    };
  }
};

export const forgotPassword = async (email) => {
  try {
    const res = await api.post('/forgot-password', { email });
    return { success: true, message: res.data.message };
  } catch {
    return { success: false };
  }
};

export const resetPassword = async (token, data) => {
  try {
    await api.patch(`/reset-password?token=${token}`, data);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.response?.data?.error || 'Error' };
  }
};

export const suspendUser = async (id) => {
  try {
    const res = await api.patch(`/user/suspend/${id}`);
    return { success: true, data: res.data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.error || 'Error al suspender usuario'
    };
  }
};

export const reactivateUser = async (id) => {
  try {
    const res = await api.patch(`/user/reactivate/${id}`);
    return { success: true, data: res.data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.error || 'Error al reactivar usuario'
    };
  }
};

export const getSuspendedUsers = async () => {
  try {
    const res = await api.get('/user/suspended');
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, message: error.response?.data?.error || 'Error al obtener usuarios suspendidos' };
  }
};

export async function getUserPublicById(userId) {
  const { data } = await api.get(`/user/public/${userId}`);
  return data; // { id_user, name, surname }
}