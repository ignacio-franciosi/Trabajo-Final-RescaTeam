// UserService.js
import api from './axiosConfigUsers';

export const getUserById = async (id) => {
  try {
    const token = localStorage.getItem('token');

    const res = await api.get(`/user/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`, // <-- ¡IMPORTANTE!
      },
    });

    return { success: true, data: res.data };
  } catch (err) {
    console.error('Error en getUserById:', err);
    return {
      success: false,
      message: err.response?.data?.message || 'Error al obtener usuario',
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
    const res = await api.patch(`/user/${userId}/change-password`, payload);
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
    const res = await api.patch(`/reset-password?token=${token}`, data);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.response?.data?.error || 'Error' };
  }
};

