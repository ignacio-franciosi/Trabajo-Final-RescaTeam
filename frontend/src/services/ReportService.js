import apiUsers from './axiosConfigUsers';

export const createReport = async (payload) => {

  try {
    const res = await apiUsers.post('/report', payload);
    return { success: true, data: res.data };
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.error || 'Error al crear el reporte',
    };
  }
};

export const getReportById = async (id) => {
  try {
    const res = await apiUsers.get(`/report/${id}`);
    return { success: true, data: res.data };
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.error || 'Error al obtener el reporte',
    };
  }
};

export const deleteReport = async (id) => {
  try {
    const res = await apiUsers.delete(`/report/${id}`);
    return { success: true, data: res.data };
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.error || 'Error al eliminar el reporte',
    };
  }
};

export const getReportsByUserId = async (userId) => {
  try {
    const res = await apiUsers.get(`/report/user/${userId}`);
    return { success: true, data: Array.isArray(res.data) ? res.data : [] };
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.error || 'Error al obtener reportes del usuario',
    };
  }
};

export const getReportsByComplainingUserId = async (complainingUserId) => {
  try {
    const res = await apiUsers.get(`/report/complainingUser/${complainingUserId}`);
    return { success: true, data: Array.isArray(res.data) ? res.data : [] };
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.error || 'Error al obtener reportes por denunciante',
    };
  }
};

export const updateReport = async (id, payload) => {
  
  try {
    const res = await apiUsers.patch(`/report/${id}`, payload);
    return { success: true, data: res.data };
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.error || 'Error al actualizar el reporte',
    };
  }
};

export const getAllReports = async () => {
  try {
    const res = await apiUsers.get('/report/all');
    return { success: true, data: Array.isArray(res.data) ? res.data : [] };
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.error || 'Error al obtener todos los reportes',
    };
  }
};

export const getAllReportsByStatus = async (status) => {

  try {
    const res = await apiUsers.get(`/report/all/${encodeURIComponent(status)}`);
    return { success: true, data: Array.isArray(res.data) ? res.data : [] };
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.error || 'Error al obtener reportes por estado',
    };
  }
};
